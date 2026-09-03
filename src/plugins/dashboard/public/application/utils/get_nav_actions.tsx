/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EUI_MODAL_CANCEL_BUTTON, EuiCompressedCheckboxGroup } from '@elastic/eui';
import { EuiCheckboxGroupIdToSelectedMap } from '@elastic/eui/src/components/form/checkbox/checkbox_group';
import {
  SaveResult,
  SavedObjectSaveOpts,
  getSavedObjectFinder,
  showSaveModal,
} from '../../../../saved_objects/public';
import { DashboardAppStateContainer, DashboardServices, NavAction } from '../../types';
import {
  DashboardSaveModal,
  TopNavIds,
  showCloneModal,
  showOptionsPopover,
  UrlParams,
} from '../components/dashboard_top_nav';
import {
  EmbeddableFactoryNotFoundError,
  EmbeddableInput,
  ViewMode,
  isErrorEmbeddable,
  openAddPanelFlyout,
} from '../../../../embeddable/public';
import { saveDashboard } from '../utils';
import { DashboardContainer } from '../embeddable/dashboard_container';
import { DashboardConstants, createDashboardEditUrl } from '../../dashboard_constants';
import {
  DASHBOARD_GRID_COLUMN_COUNT,
  SECTION_HEADER_ROWS,
} from '../embeddable/dashboard_constants';
import {
  DASHBOARD_SECTION_EMBEDDABLE,
  buildSectionMemberMap,
  DashboardSectionEmbeddableInput,
} from '../embeddable/section';
import { unhashUrl } from '../../../../opensearch_dashboards_utils/public';
import { Dashboard } from '../../dashboard';
import { showAddPanelPopover } from '../components/dashboard_top_nav/top_nav/show_add_panel_popover';

interface UrlParamsSelectedMap {
  [UrlParams.SHOW_TOP_MENU]: boolean;
  [UrlParams.SHOW_QUERY_INPUT]: boolean;
  [UrlParams.SHOW_TIME_FILTER]: boolean;
  [UrlParams.SHOW_FILTER_BAR]: boolean;
}

interface UrlParamValues extends Omit<UrlParamsSelectedMap, UrlParams.SHOW_FILTER_BAR> {
  [UrlParams.HIDE_FILTER_BAR]: boolean;
}

export const getNavActions = (
  stateContainer: DashboardAppStateContainer,
  savedDashboard: any,
  services: DashboardServices,
  dashboard: Dashboard,
  dashboardIdFromUrl?: string,
  currentContainer?: DashboardContainer
) => {
  const {
    embeddable,
    data: { query: queryService },
    notifications,
    overlays,
    i18n: { Context: I18nContext },
    savedObjects,
    uiSettings,
    chrome,
    share,
    dashboardConfig,
    dashboardCapabilities,
  } = services;
  const navActions: {
    [key: string]: NavAction;
  } = {};

  if (!stateContainer) {
    return navActions;
  }
  const appState = stateContainer.getState();
  navActions[TopNavIds.FULL_SCREEN] = () => {
    stateContainer.transitions.set('fullScreenMode', true);
  };
  navActions[TopNavIds.EXIT_EDIT_MODE] = () => onChangeViewMode(ViewMode.VIEW);
  navActions[TopNavIds.ENTER_EDIT_MODE] = () => onChangeViewMode(ViewMode.EDIT);
  navActions[TopNavIds.SAVE] = () => {
    const currentTitle = appState.title;
    const currentDescription = appState.description;
    const currentTimeRestore = appState.timeRestore;
    const onSave = ({
      newTitle,
      newDescription,
      newCopyOnSave,
      newTimeRestore,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: {
      newTitle: string;
      newDescription: string;
      newCopyOnSave: boolean;
      newTimeRestore: boolean;
      isTitleDuplicateConfirmed: boolean;
      onTitleDuplicate: () => void;
    }) => {
      stateContainer.transitions.setDashboard({
        title: newTitle,
        description: newDescription,
        timeRestore: newTimeRestore,
      });
      savedDashboard.copyOnSave = newCopyOnSave;

      const saveOptions = {
        confirmOverwrite: false,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
      };
      return save(saveOptions).then((response: SaveResult) => {
        // If the save wasn't successful, put the original values back.
        if (!(response as { id: string }).id) {
          stateContainer.transitions.setDashboard({
            title: currentTitle,
            description: currentDescription,
            timeRestore: currentTimeRestore,
          });
        }

        // If the save was successful, then set the dashboard isDirty back to false
        dashboard.setIsDirty(false);
        return response;
      });
    };

    const dashboardSaveModal = (
      <DashboardSaveModal
        onSave={onSave}
        onClose={() => {}}
        title={currentTitle}
        description={currentDescription}
        timeRestore={currentTimeRestore}
        showCopyOnSave={savedDashboard.id ? true : false}
      />
    );
    showSaveModal(dashboardSaveModal, I18nContext);
  };

  navActions[TopNavIds.CLONE] = () => {
    const currentTitle = appState.title;
    const onClone = (
      newTitle: string,
      isTitleDuplicateConfirmed: boolean,
      onTitleDuplicate: () => void
    ) => {
      savedDashboard.copyOnSave = true;
      stateContainer.transitions.set('title', newTitle);
      const saveOptions = {
        confirmOverwrite: false,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
      };
      return save(saveOptions).then((response: { id?: string } | { error: Error }) => {
        // If the save wasn't successful, put the original title back.
        if ((response as { error: Error }).error) {
          stateContainer.transitions.set('title', currentTitle);
        }
        // updateNavBar();
        return response;
      });
    };

    showCloneModal(onClone, currentTitle);
  };

  if (uiSettings.get('home:useNewHomePage')) {
    navActions[TopNavIds.ADD_EXISTING] = (anchorElement) => {
      if (currentContainer && !isErrorEmbeddable(currentContainer)) {
        showAddPanelPopover({
          anchorElement,
          uiActions: services.uiActions,
          // "Add section" lives inside this "Create new" menu
          // (after the Metrics visualization entry), not as a separate top-nav
          // button. Reuses the same creation logic as navActions[ADD_SECTION].
          // Gated behind the allowDashboardSections feature flag -- when off,
          // onAddSection is undefined and the popover omits the "Section" item.
          onAddSection: services.allowDashboardSections
            ? () => navActions[TopNavIds.ADD_SECTION]?.(anchorElement)
            : undefined,
          onAddExistingPanelFlyout: () => {
            openAddPanelFlyout({
              embeddable: currentContainer,
              getAllFactories: embeddable.getEmbeddableFactories,
              getFactory: embeddable.getEmbeddableFactory,
              notifications,
              overlays,
              SavedObjectFinder: getSavedObjectFinder(
                savedObjects,
                uiSettings,
                services.data,
                services.application
              ),
            });
          },
          containerInfo: {
            containerId: currentContainer.getInput().id,
            containerName: currentContainer.getTitle(),
          },
        });
      }
    };
  } else {
    navActions[TopNavIds.ADD_EXISTING] = () => {
      if (currentContainer && !isErrorEmbeddable(currentContainer)) {
        openAddPanelFlyout({
          embeddable: currentContainer,
          getAllFactories: embeddable.getEmbeddableFactories,
          getFactory: embeddable.getEmbeddableFactory,
          notifications,
          overlays,
          SavedObjectFinder: getSavedObjectFinder(
            savedObjects,
            uiSettings,
            services.data,
            services.application
          ),
        });
      }
    };
  }

  navActions[TopNavIds.VISUALIZE] = async () => {
    const type = 'visualization';
    const factory = embeddable.getEmbeddableFactory(type);
    if (!factory) {
      throw new EmbeddableFactoryNotFoundError(type);
    }
    await factory.create({} as EmbeddableInput, currentContainer);
  };

  // Dashboard collapsible sections.
  // Creates a section via the same container.addNewEmbeddable() primitive every
  // other panel uses. addNewEmbeddable's default placement gives a half-width
  // box (DEFAULT_PANEL_WIDTH); a section is widened to full-width right after,
  // matching the plan's "row-spanning header marker" design -- no custom
  // placement-strategy code needed.
  navActions[TopNavIds.ADD_SECTION] = async () => {
    if (!currentContainer || isErrorEmbeddable(currentContainer)) {
      return;
    }
    const sectionEmbeddable = await currentContainer.addNewEmbeddable(
      DASHBOARD_SECTION_EMBEDDABLE,
      {
        title: i18n.translate('dashboard.topNav.addSection.defaultTitle', {
          defaultMessage: 'New section',
        }),
        collapsed: false,
        // Option 1: the section owns its members. A new section starts empty.
        members: [],
      }
    );
    const panels = currentContainer.getInput().panels;
    const sectionPanel = panels[sectionEmbeddable.id];
    if (sectionPanel) {
      // place a NEW section at the BOTTOM of the dashboard by
      // default (below all existing top-level content), not wherever
      // addNewEmbeddable's default top-left placement put it. Compute the
      // max bottom edge across outer-space panels (ungrouped panels + section
      // panels), treating each section's rendered height as its header rows
      // plus its members' content -- mirroring DashboardGrid.
      // computeSectionOuterHeight so we land just past the last section too.
      const memberMap = buildSectionMemberMap(panels);
      let maxBottom = 0;
      Object.values(panels).forEach((p) => {
        if (p.explicitInput.id === sectionEmbeddable.id) return;
        if (memberMap.has(p.explicitInput.id)) return; // members live in inner grids
        let effectiveH = p.gridData.h;
        if (p.type === DASHBOARD_SECTION_EMBEDDABLE) {
          const members =
            (p.explicitInput as Partial<DashboardSectionEmbeddableInput>).members ?? [];
          const innerRows = members.reduce((mx, m) => Math.max(mx, m.gridData.y + m.gridData.h), 0);
          const collapsed = Boolean((p.explicitInput as { collapsed?: boolean }).collapsed);
          effectiveH = collapsed ? SECTION_HEADER_ROWS : SECTION_HEADER_ROWS + innerRows;
        }
        maxBottom = Math.max(maxBottom, p.gridData.y + effectiveH);
      });
      currentContainer.updateInput({
        panels: {
          ...panels,
          [sectionEmbeddable.id]: {
            ...sectionPanel,
            gridData: {
              ...sectionPanel.gridData,
              x: 0,
              y: maxBottom,
              w: DASHBOARD_GRID_COLUMN_COUNT,
              h: 4,
            },
          },
        },
      });
    }
  };

  navActions[TopNavIds.OPTIONS] = (anchorElement) => {
    showOptionsPopover({
      anchorElement,
      useMargins: appState.options.useMargins === undefined ? false : appState.options.useMargins,
      onUseMarginsChange: (isChecked: boolean) => {
        stateContainer.transitions.setOption('useMargins', isChecked);
      },
      hidePanelTitles: appState.options.hidePanelTitles,
      onHidePanelTitlesChange: (isChecked: boolean) => {
        stateContainer.transitions.setOption('hidePanelTitles', isChecked);
      },
      useSharedCrosshair: appState.options.useSharedCrosshair ?? false,
      onUseSharedCrosshairChange: (isChecked: boolean) => {
        stateContainer.transitions.setOption('useSharedCrosshair', isChecked);
      },
    });
  };

  if (share) {
    // the share button is only availabale if "share" plugin contract enabled
    navActions[TopNavIds.SHARE] = (anchorElement) => {
      const EmbedUrlParamExtension = ({
        setParamValue,
      }: {
        setParamValue: (paramUpdate: UrlParamValues) => void;
      }): ReactElement => {
        const [urlParamsSelectedMap, setUrlParamsSelectedMap] = useState<UrlParamsSelectedMap>({
          [UrlParams.SHOW_TOP_MENU]: false,
          [UrlParams.SHOW_QUERY_INPUT]: false,
          [UrlParams.SHOW_TIME_FILTER]: false,
          [UrlParams.SHOW_FILTER_BAR]: true,
        });

        const checkboxes = [
          {
            id: UrlParams.SHOW_TOP_MENU,
            label: i18n.translate('dashboard.embedUrlParamExtension.topMenu', {
              defaultMessage: 'Top menu',
            }),
          },
          {
            id: UrlParams.SHOW_QUERY_INPUT,
            label: i18n.translate('dashboard.embedUrlParamExtension.query', {
              defaultMessage: 'Query',
            }),
          },
          {
            id: UrlParams.SHOW_TIME_FILTER,
            label: i18n.translate('dashboard.embedUrlParamExtension.timeFilter', {
              defaultMessage: 'Time filter',
            }),
          },
          {
            id: UrlParams.SHOW_FILTER_BAR,
            label: i18n.translate('dashboard.embedUrlParamExtension.filterBar', {
              defaultMessage: 'Filter bar',
            }),
          },
        ];

        const handleChange = (param: string): void => {
          const urlParamsSelectedMapUpdate = {
            ...urlParamsSelectedMap,
            [param]: !urlParamsSelectedMap[param as keyof UrlParamsSelectedMap],
          };
          setUrlParamsSelectedMap(urlParamsSelectedMapUpdate);

          const urlParamValues = {
            [UrlParams.SHOW_TOP_MENU]: urlParamsSelectedMap[UrlParams.SHOW_TOP_MENU],
            [UrlParams.SHOW_QUERY_INPUT]: urlParamsSelectedMap[UrlParams.SHOW_QUERY_INPUT],
            [UrlParams.SHOW_TIME_FILTER]: urlParamsSelectedMap[UrlParams.SHOW_TIME_FILTER],
            [UrlParams.HIDE_FILTER_BAR]: !urlParamsSelectedMap[UrlParams.SHOW_FILTER_BAR],
            [param === UrlParams.SHOW_FILTER_BAR ? UrlParams.HIDE_FILTER_BAR : param]:
              param === UrlParams.SHOW_FILTER_BAR
                ? urlParamsSelectedMap[UrlParams.SHOW_FILTER_BAR]
                : !urlParamsSelectedMap[param as keyof UrlParamsSelectedMap],
          };
          setParamValue(urlParamValues);
        };

        return (
          <EuiCompressedCheckboxGroup
            options={checkboxes}
            idToSelectedMap={urlParamsSelectedMap as unknown as EuiCheckboxGroupIdToSelectedMap}
            onChange={handleChange}
            legend={{
              children: i18n.translate('dashboard.embedUrlParamExtension.include', {
                defaultMessage: 'Include',
              }),
            }}
            data-test-subj="embedUrlParamExtension"
          />
        );
      };

      share.toggleShareContextMenu({
        anchorElement,
        allowEmbed: true,
        allowShortUrl:
          !dashboardConfig.getHideWriteControls() || dashboardCapabilities.createShortUrl,
        shareableUrl: unhashUrl(window.location.href),
        objectId: savedDashboard.id,
        objectType: 'dashboard',
        sharingData: {
          title: savedDashboard.title,
        },
        isDirty: dashboard.isDirty,
        embedUrlParamExtensions: [
          {
            paramName: 'embed',
            component: EmbedUrlParamExtension,
          },
        ],
      });
    };
  }

  function onChangeViewMode(newMode: ViewMode) {
    const isPageRefresh = newMode === appState.viewMode;
    const isLeavingEditMode = !isPageRefresh && newMode === ViewMode.VIEW;
    const willLoseChanges = isLeavingEditMode && dashboard.isDirty;

    // If there are no changes, do not show the discard window
    if (!willLoseChanges) {
      overlays.closeFlyout();
      stateContainer.transitions.set('viewMode', newMode);
      return;
    }

    // If there are changes, show the discard window, and reset the states to original
    function revertChangesAndExitEditMode() {
      const pathname = savedDashboard.id
        ? createDashboardEditUrl(savedDashboard.id)
        : DashboardConstants.CREATE_NEW_DASHBOARD_URL;

      currentContainer?.updateAppStateUrl?.({ replace: false, pathname });

      const newStateContainer: { [key: string]: any } = {};
      // This is only necessary for new dashboards, which will default to Edit mode.
      newStateContainer.viewMode = ViewMode.VIEW;

      // We need to reset the app state to its original state
      if (dashboard.panels) {
        newStateContainer.panels = dashboard.panels;
      }

      newStateContainer.filters = dashboard.filters;
      newStateContainer.query = dashboard.query;
      newStateContainer.options = {
        hidePanelTitles: dashboard.options.hidePanelTitles,
        useMargins: dashboard.options.useMargins,
        useSharedCrosshair: dashboard.options.useSharedCrosshair,
      };
      newStateContainer.timeRestore = dashboard.timeRestore;
      stateContainer.transitions.setDashboard(newStateContainer);

      // Since time filters are not tracked by app state, we need to manually reset it
      if (stateContainer.getState().timeRestore) {
        queryService.timefilter.timefilter.setTime({
          from: dashboard.timeFrom,
          to: dashboard.timeTo,
        });
        if (dashboard.refreshInterval) {
          queryService.timefilter.timefilter.setRefreshInterval(dashboard.refreshInterval);
        }
      }

      overlays.closeFlyout();

      // Set the isDirty flag back to false since we discard all the changes
      dashboard.setIsDirty(false);
    }

    overlays
      .openConfirm(
        i18n.translate('dashboard.changeViewModeConfirmModal.discardChangesDescription', {
          defaultMessage: `Once you discard your changes, there's no getting them back.`,
        }),
        {
          confirmButtonText: i18n.translate(
            'dashboard.changeViewModeConfirmModal.confirmButtonLabel',
            { defaultMessage: 'Discard changes' }
          ),
          cancelButtonText: i18n.translate(
            'dashboard.changeViewModeConfirmModal.cancelButtonLabel',
            { defaultMessage: 'Continue editing' }
          ),
          defaultFocusedButton: EUI_MODAL_CANCEL_BUTTON,
          title: i18n.translate('dashboard.changeViewModeConfirmModal.discardChangesTitle', {
            defaultMessage: 'Discard changes to dashboard?',
          }),
        }
      )
      .then((isConfirmed) => {
        if (isConfirmed) {
          revertChangesAndExitEditMode();
        }
      });
  }

  async function save(saveOptions: SavedObjectSaveOpts) {
    const timefilter = queryService.timefilter.timefilter;
    try {
      const id = await saveDashboard(
        timefilter,
        stateContainer,
        savedDashboard,
        saveOptions,
        dashboard
      );

      if (id) {
        notifications.toasts.addSuccess({
          title: i18n.translate('dashboard.dashboardWasSavedSuccessMessage', {
            defaultMessage: `Dashboard '{dashTitle}' was saved`,
            values: { dashTitle: savedDashboard.title },
          }),
          'data-test-subj': 'saveDashboardSuccess',
        });

        if (id !== dashboardIdFromUrl) {
          const pathname = createDashboardEditUrl(id);
          currentContainer?.updateAppStateUrl?.({ replace: false, pathname });
        }

        chrome.docTitle.change(savedDashboard.title);
        stateContainer.transitions.set('viewMode', ViewMode.VIEW);
      }
      return { id };
    } catch (error) {
      notifications.toasts.addDanger({
        title: i18n.translate('dashboard.dashboardWasNotSavedDangerMessage', {
          defaultMessage: `Dashboard '{dashTitle}' was not saved. Error: {errorMessage}`,
          values: {
            dashTitle: savedDashboard.title,
            errorMessage: savedDashboard.message,
          },
        }),
        'data-test-subj': 'saveDashboardFailure',
      });
      return { error };
    }
  }

  return navActions;
};
