/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import _ from 'lodash';

import { i18n } from '@osd/i18n';

import { createHashHistory } from 'history';

import {
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import { syncQueryStateWithUrl } from '../../data/public';

import { getSavedSheetBreadcrumbs, getCreateBreadcrumbs } from './breadcrumbs';
import {
  addFatalError,
  registerListenEventListener,
  watchMultiDecorator,
} from '../../opensearch_dashboards_legacy/public';
import { getTimezone } from '../../vis_type_timeline/public';
import { initCellsDirective } from './directives/cells/cells';
import { initFullscreenDirective } from './directives/fullscreen/fullscreen';
import { initFixedElementDirective } from './directives/fixed_element';
import { initTimelineLoadSheetDirective } from './directives/timeline_load_sheet';
import { initTimelineHelpDirective } from './directives/timeline_help/timeline_help';
import { initTimelineSaveSheetDirective } from './directives/timeline_save_sheet';
import { initTimelineOptionsSheetDirective } from './directives/timeline_options_sheet';
import { initSavedObjectSaveAsCheckBoxDirective } from './directives/saved_object_save_as_checkbox';
import { initSavedObjectFinderDirective } from './directives/saved_object_finder';
import { initTimelineTabsDirective } from './components/timelinehelp_tabs_directive';
import { initTimelineTDeprecationDirective } from './components/timeline_deprecation_directive';
import { initInputFocusDirective } from './directives/input_focus';
import { Chart } from './directives/chart/chart';
import { TimelineInterval } from './directives/timeline_interval/timeline_interval';
import { timelineExpInput } from './directives/timeline_expression_input';
import { TimelineExpressionSuggestions } from './directives/timeline_expression_suggestions/timeline_expression_suggestions';
import { initSavedSheetService } from './services/saved_sheets';
import { initTimelineAppState } from './timeline_app_state';

import rootTemplate from './index.html';

export function initTimelineApp(app, deps) {
  app.run(registerListenEventListener);

  const savedSheetLoader = initSavedSheetService(app, deps);

  app.factory('history', () => createHashHistory());
  app.factory('osdUrlStateStorage', (history) =>
    createOsdUrlStateStorage({
      history,
      useHash: deps.core.uiSettings.get('state:storeInSessionStorage'),
      ...withNotifyOnErrors(deps.core.notifications.toasts),
    })
  );
  app.config(watchMultiDecorator);

  app
    .controller('TimelineVisController', function ($scope) {
      $scope.$on('timelineChartRendered', (event) => {
        event.stopPropagation();
        $scope.renderComplete();
      });
    })
    .constant('timelinePanels', deps.timelinePanels)
    .directive('chart', Chart)
    .directive('timelineInterval', TimelineInterval)
    .directive('timelineExpressionSuggestions', TimelineExpressionSuggestions)
    .directive('timelineExpressionInput', timelineExpInput(deps));

  initTimelineHelpDirective(app);
  initInputFocusDirective(app);
  initTimelineTabsDirective(app, deps);
  initTimelineTDeprecationDirective(app, deps);
  initSavedObjectFinderDirective(app, savedSheetLoader, deps.core.uiSettings);
  initSavedObjectSaveAsCheckBoxDirective(app);
  initCellsDirective(app);
  initFixedElementDirective(app);
  initFullscreenDirective(app);
  initTimelineSaveSheetDirective(app);
  initTimelineLoadSheetDirective(app);
  initTimelineOptionsSheetDirective(app);

  const location = 'Timeline';

  app.directive('timelineApp', function () {
    return {
      restrict: 'E',
      controllerAs: 'timelineApp',
      controller: timelineController,
    };
  });

  function timelineController(
    $http,
    $route,
    $routeParams,
    $scope,
    $timeout,
    history,
    osdUrlStateStorage
  ) {
    // Keeping this at app scope allows us to keep the current page when the user
    // switches to say, the timepicker.
    $scope.page = deps.core.uiSettings.get('timeline:showTutorial', true) ? 1 : 0;
    $scope.setPage = (page) => ($scope.page = page);
    const timefilter = deps.plugins.data.query.timefilter.timefilter;

    timefilter.enableAutoRefreshSelector();
    timefilter.enableTimeRangeSelector();

    deps.core.chrome.docTitle.change('Timeline - OpenSearch Dashboards');

    // starts syncing `_g` portion of url with query services
    const { stop: stopSyncingQueryServiceStateWithUrl } = syncQueryStateWithUrl(
      deps.plugins.data.query,
      osdUrlStateStorage
    );

    const savedSheet = $route.current.locals.savedSheet;

    function getStateDefaults() {
      return {
        sheet: savedSheet.timelion_sheet,
        selected: 0,
        columns: savedSheet.timelion_columns,
        rows: savedSheet.timelion_rows,
        interval: savedSheet.timelion_interval,
      };
    }

    const { stateContainer, stopStateSync } = initTimelineAppState({
      stateDefaults: getStateDefaults(),
      osdUrlStateStorage,
    });

    $scope.state = _.cloneDeep(stateContainer.getState());
    $scope.expression = _.clone($scope.state.sheet[$scope.state.selected]);
    $scope.updatedSheets = [];

    const savedVisualizations = deps.plugins.visualizations.savedVisualizationsLoader;
    const timezone = getTimezone(deps.core.uiSettings);

    const defaultExpression = '.es(*)';

    $scope.topNavMenu = getTopNavMenu();

    $timeout(function () {
      if (deps.core.uiSettings.get('timeline:showTutorial', true)) {
        $scope.toggleMenu('showHelp');
      }
    }, 0);

    $scope.transient = {};

    function getTopNavMenu() {
      const newSheetAction = {
        id: 'new',
        label: i18n.translate('timeline.topNavMenu.newSheetButtonLabel', {
          defaultMessage: 'New',
        }),
        description: i18n.translate('timeline.topNavMenu.newSheetButtonAriaLabel', {
          defaultMessage: 'New Sheet',
        }),
        run: function () {
          history.push('/');
          $route.reload();
        },
        testId: 'timelineNewButton',
      };

      const addSheetAction = {
        id: 'add',
        label: i18n.translate('timeline.topNavMenu.addChartButtonLabel', {
          defaultMessage: 'Add',
        }),
        description: i18n.translate('timeline.topNavMenu.addChartButtonAriaLabel', {
          defaultMessage: 'Add a chart',
        }),
        run: function () {
          $scope.$evalAsync(() => $scope.newCell());
        },
        testId: 'timelineAddChartButton',
      };

      const saveSheetAction = {
        id: 'save',
        label: i18n.translate('timeline.topNavMenu.saveSheetButtonLabel', {
          defaultMessage: 'Save',
        }),
        description: i18n.translate('timeline.topNavMenu.saveSheetButtonAriaLabel', {
          defaultMessage: 'Save Sheet',
        }),
        run: () => {
          $scope.$evalAsync(() => $scope.toggleMenu('showSave'));
        },
        testId: 'timelineSaveButton',
      };

      const deleteSheetAction = {
        id: 'delete',
        label: i18n.translate('timeline.topNavMenu.deleteSheetButtonLabel', {
          defaultMessage: 'Delete',
        }),
        description: i18n.translate('timeline.topNavMenu.deleteSheetButtonAriaLabel', {
          defaultMessage: 'Delete current sheet',
        }),
        disableButton: function () {
          return !savedSheet.id;
        },
        run: function () {
          const title = savedSheet.title;
          function doDelete() {
            savedSheet
              .delete()
              .then(() => {
                deps.core.notifications.toasts.addSuccess(
                  i18n.translate('timeline.topNavMenu.delete.modal.successNotificationText', {
                    defaultMessage: `Deleted '{title}'`,
                    values: { title },
                  })
                );
                history.push('/');
              })
              .catch((error) => addFatalError(deps.core.fatalErrors, error, location));
          }

          const confirmModalOptions = {
            confirmButtonText: i18n.translate(
              'timeline.topNavMenu.delete.modal.confirmButtonLabel',
              {
                defaultMessage: 'Delete',
              }
            ),
            title: i18n.translate('timeline.topNavMenu.delete.modalTitle', {
              defaultMessage: `Delete Timeline sheet '{title}'?`,
              values: { title },
            }),
          };

          $scope.$evalAsync(() => {
            deps.core.overlays
              .openConfirm(
                i18n.translate('timeline.topNavMenu.delete.modal.warningText', {
                  defaultMessage: `You can't recover deleted sheets.`,
                }),
                confirmModalOptions
              )
              .then((isConfirmed) => {
                if (isConfirmed) {
                  doDelete();
                }
              });
          });
        },
        testId: 'timelineDeleteButton',
      };

      const openSheetAction = {
        id: 'open',
        label: i18n.translate('timeline.topNavMenu.openSheetButtonLabel', {
          defaultMessage: 'Open',
        }),
        description: i18n.translate('timeline.topNavMenu.openSheetButtonAriaLabel', {
          defaultMessage: 'Open Sheet',
        }),
        run: () => {
          $scope.$evalAsync(() => $scope.toggleMenu('showLoad'));
        },
        testId: 'timelineOpenButton',
      };

      const optionsAction = {
        id: 'options',
        label: i18n.translate('timeline.topNavMenu.optionsButtonLabel', {
          defaultMessage: 'Options',
        }),
        description: i18n.translate('timeline.topNavMenu.optionsButtonAriaLabel', {
          defaultMessage: 'Options',
        }),
        run: () => {
          $scope.$evalAsync(() => $scope.toggleMenu('showOptions'));
        },
        testId: 'timelineOptionsButton',
      };

      const helpAction = {
        id: 'help',
        label: i18n.translate('timeline.topNavMenu.helpButtonLabel', {
          defaultMessage: 'Help',
        }),
        description: i18n.translate('timeline.topNavMenu.helpButtonAriaLabel', {
          defaultMessage: 'Help',
        }),
        run: () => {
          $scope.$evalAsync(() => $scope.toggleMenu('showHelp'));
        },
        testId: 'timelineDocsButton',
      };

      if (deps.core.application.capabilities.timelion.save) {
        return [
          newSheetAction,
          addSheetAction,
          saveSheetAction,
          deleteSheetAction,
          openSheetAction,
          optionsAction,
          helpAction,
        ];
      }
      return [newSheetAction, addSheetAction, openSheetAction, optionsAction, helpAction];
    }

    let refresher;
    const setRefreshData = function () {
      if (refresher) $timeout.cancel(refresher);
      const interval = timefilter.getRefreshInterval();
      if (interval.value > 0 && !interval.pause) {
        function startRefresh() {
          refresher = $timeout(function () {
            if (!$scope.running) $scope.search();
            startRefresh();
          }, interval.value);
        }
        startRefresh();
      }
    };

    const init = function () {
      $scope.running = false;
      $scope.search();
      setRefreshData();

      $scope.model = {
        timeRange: timefilter.getTime(),
        refreshInterval: timefilter.getRefreshInterval(),
      };

      const unsubscribeStateUpdates = stateContainer.subscribe((state) => {
        const clonedState = _.cloneDeep(state);
        $scope.updatedSheets.forEach((updatedSheet) => {
          clonedState.sheet[updatedSheet.id] = updatedSheet.expression;
        });
        $scope.state = clonedState;
        $scope.opts.state = clonedState;
        $scope.expression = _.clone($scope.state.sheet[$scope.state.selected]);
        $scope.search();
      });

      timefilter.getFetch$().subscribe($scope.search);

      $scope.opts = {
        saveExpression: saveExpression,
        saveSheet: saveSheet,
        savedSheet: savedSheet,
        state: _.cloneDeep(stateContainer.getState()),
        search: $scope.search,
        dontShowHelp: function () {
          deps.core.uiSettings.set('timeline:showTutorial', false);
          $scope.setPage(0);
          $scope.closeMenus();
        },
      };

      $scope.$watch('opts.state.rows', function (newRow) {
        const state = stateContainer.getState();
        if (state.rows !== newRow) {
          stateContainer.transitions.set('rows', newRow);
        }
      });

      $scope.$watch('opts.state.columns', function (newColumn) {
        const state = stateContainer.getState();
        if (state.columns !== newColumn) {
          stateContainer.transitions.set('columns', newColumn);
        }
      });

      $scope.menus = {
        showHelp: false,
        showSave: false,
        showLoad: false,
        showOptions: false,
      };

      $scope.toggleMenu = (menuName) => {
        const curState = $scope.menus[menuName];
        $scope.closeMenus();
        $scope.menus[menuName] = !curState;
      };

      $scope.closeMenus = () => {
        _.forOwn($scope.menus, function (value, key) {
          $scope.menus[key] = false;
        });
      };

      $scope.$on('$destroy', () => {
        stopSyncingQueryServiceStateWithUrl();
        unsubscribeStateUpdates();
        stopStateSync();
      });
    };

    $scope.onTimeUpdate = function ({ dateRange }) {
      $scope.model.timeRange = {
        ...dateRange,
      };
      timefilter.setTime(dateRange);
      if (!$scope.running) $scope.search();
    };

    $scope.onRefreshChange = function ({ isPaused, refreshInterval }) {
      $scope.model.refreshInterval = {
        pause: isPaused,
        value: refreshInterval,
      };
      timefilter.setRefreshInterval({
        pause: isPaused,
        value: refreshInterval ? refreshInterval : $scope.refreshInterval.value,
      });

      setRefreshData();
    };

    $scope.$watch(
      function () {
        return savedSheet.lastSavedTitle;
      },
      function (newTitle) {
        if (savedSheet.id && newTitle) {
          deps.core.chrome.docTitle.change(newTitle);
        }
      }
    );

    $scope.$watch('expression', function (newExpression) {
      const state = stateContainer.getState();
      if (state.sheet[state.selected] !== newExpression) {
        const updatedSheet = $scope.updatedSheets.find(
          (updatedSheet) => updatedSheet.id === state.selected
        );
        if (updatedSheet) {
          updatedSheet.expression = newExpression;
        } else {
          $scope.updatedSheets.push({
            id: state.selected,
            expression: newExpression,
          });
        }
      }
    });

    $scope.toggle = function (property) {
      $scope[property] = !$scope[property];
    };

    $scope.changeInterval = function (interval) {
      $scope.currentInterval = interval;
    };

    $scope.updateChart = function () {
      const state = stateContainer.getState();
      const newSheet = _.clone(state.sheet);
      if ($scope.updatedSheets.length) {
        $scope.updatedSheets.forEach((updatedSheet) => {
          newSheet[updatedSheet.id] = updatedSheet.expression;
        });
        $scope.updatedSheets = [];
      }
      stateContainer.transitions.updateState({
        interval: $scope.currentInterval ? $scope.currentInterval : state.interval,
        sheet: newSheet,
      });
    };

    $scope.newSheet = function () {
      history.push('/');
    };

    $scope.removeSheet = function (removedIndex) {
      const state = stateContainer.getState();
      const newSheet = state.sheet.filter((el, index) => index !== removedIndex);
      $scope.updatedSheets = $scope.updatedSheets.filter((el) => el.id !== removedIndex);
      stateContainer.transitions.updateState({
        sheet: newSheet,
        selected: removedIndex ? removedIndex - 1 : removedIndex,
      });
    };

    $scope.newCell = function () {
      const state = stateContainer.getState();
      const newSheet = [...state.sheet, defaultExpression];
      stateContainer.transitions.updateState({ sheet: newSheet, selected: newSheet.length - 1 });
    };

    $scope.setActiveCell = function (cell) {
      const state = stateContainer.getState();
      if (state.selected !== cell) {
        stateContainer.transitions.updateState({ sheet: $scope.state.sheet, selected: cell });
      }
    };

    $scope.search = function () {
      $scope.running = true;
      const state = stateContainer.getState();

      // parse the time range client side to make sure it behaves like other charts
      const timeRangeBounds = timefilter.getBounds();

      const httpResult = $http
        .post('../api/timeline/run', {
          sheet: state.sheet,
          time: _.assignIn(
            {
              from: timeRangeBounds.min,
              to: timeRangeBounds.max,
            },
            {
              interval: state.interval,
              timezone: timezone,
            }
          ),
        })
        .then((resp) => resp.data)
        .catch((resp) => {
          throw resp.data;
        });

      httpResult
        .then(function (resp) {
          $scope.stats = resp.stats;
          $scope.sheet = resp.sheet;
          _.forEach(resp.sheet, function (cell) {
            if (cell.exception && cell.plot !== state.selected) {
              stateContainer.transitions.set('selected', cell.plot);
            }
          });
          $scope.running = false;
        })
        .catch(function (resp) {
          $scope.sheet = [];
          $scope.running = false;

          const err = new Error(resp.message);
          err.stack = resp.stack;
          deps.core.notifications.toasts.addError(err, {
            title: i18n.translate('timeline.searchErrorTitle', {
              defaultMessage: 'Timeline request error',
            }),
          });
        });
    };

    $scope.safeSearch = _.debounce($scope.search, 500);

    function saveSheet() {
      const state = stateContainer.getState();
      savedSheet.timeline_sheet = state.sheet;
      savedSheet.timeline_interval = state.interval;
      savedSheet.timeline_columns = state.columns;
      savedSheet.timeline_rows = state.rows;
      savedSheet.save().then(function (id) {
        if (id) {
          deps.core.notifications.toasts.addSuccess({
            title: i18n.translate('timeline.saveSheet.successNotificationText', {
              defaultMessage: `Saved sheet '{title}'`,
              values: { title: savedSheet.title },
            }),
            'data-test-subj': 'timelineSaveSuccessToast',
          });

          if (savedSheet.id !== $routeParams.id) {
            history.push(`/${savedSheet.id}`);
          }
        }
      });
    }

    async function saveExpression(title) {
      const vis = await deps.plugins.visualizations.createVis('timelion', {
        title,
        params: {
          expression: $scope.state.sheet[$scope.state.selected],
          interval: $scope.state.interval,
        },
      });
      const state = deps.plugins.visualizations.convertFromSerializedVis(vis.serialize());
      const visSavedObject = await savedVisualizations.get();
      Object.assign(visSavedObject, state);
      const id = await visSavedObject.save();
      if (id) {
        deps.core.notifications.toasts.addSuccess(
          i18n.translate('timeline.saveExpression.successNotificationText', {
            defaultMessage: `Saved expression '{title}'`,
            values: { title: state.title },
          })
        );
      }
    }

    init();
  }

  app.config(function ($routeProvider) {
    $routeProvider
      .when('/:id?', {
        template: rootTemplate,
        reloadOnSearch: false,
        k7Breadcrumbs: ($injector, $route) =>
          $injector.invoke(
            $route.current.params.id ? getSavedSheetBreadcrumbs : getCreateBreadcrumbs
          ),
        badge: () => {
          if (deps.core.application.capabilities.timelion.save) {
            return undefined;
          }

          return {
            text: i18n.translate('timeline.badge.readOnly.text', {
              defaultMessage: 'Read only',
            }),
            tooltip: i18n.translate('timeline.badge.readOnly.tooltip', {
              defaultMessage: 'Unable to save Timeline sheets',
            }),
            iconType: 'glasses',
          };
        },
        resolve: {
          savedSheet: function (savedSheets, $route) {
            return savedSheets
              .get($route.current.params.id)
              .then((savedSheet) => {
                if ($route.current.params.id) {
                  deps.core.chrome.recentlyAccessed.add(
                    savedSheet.getFullPath(),
                    savedSheet.title,
                    savedSheet.id
                  );
                }
                return savedSheet;
              })
              .catch();
          },
        },
      })
      .otherwise('/');
  });
}
