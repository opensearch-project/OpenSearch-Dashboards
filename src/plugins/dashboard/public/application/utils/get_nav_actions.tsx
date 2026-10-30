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
  checkForDuplicateTitle,
  getSavedObjectFinder,
  isErrorNonFatal,
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
import { appendEmptySection, migrateAllPanelsToSection } from '../embeddable/section_layout_utils';
import { unhashUrl } from '../../../../opensearch_dashboards_utils/public';
import { Dashboard } from '../../dashboard';
import { showAddPanelPopover } from '../components/dashboard_top_nav/top_nav/show_add_panel_popover';
import { convertSavedDashboardPanelToPanelState } from './embeddable_saved_object_converters';
import {
  applyCopyPanels,
  revertCopyPanels,
  CreatedPanelCopy,
  PanelCopyFailure,
} from './apply_copy_panels';

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

  // Surface panels whose backing object could not be copied during "Copy panels".
  // The dashboard still saved (those panels remain shared); this is a non-fatal
  // warning listing what was not duplicated.
  const warnCopyPanelFailures = (failures: PanelCopyFailure[]) => {
    if (!failures.length) {
      return;
    }
    const names = failures.map((f) => f.title || `${f.type}:${f.id}`).join(', ');
    notifications.toasts.addWarning({
      title: i18n.translate('dashboard.topNav.copyPanels.partialFailureTitle', {
        defaultMessage:
          '{count, plural, one {# panel was not copied and still points to the original} other {# panels were not copied and still point to the original}}',
        values: { count: failures.length },
      }),
      text: names,
    });
  };

  navActions[TopNavIds.FULL_SCREEN] = () => {
    stateContainer.transitions.set('fullScreenMode', true);
  };
  navActions[TopNavIds.EXIT_EDIT_MODE] = () => onChangeViewMode(ViewMode.VIEW);
  navActions[TopNavIds.ENTER_EDIT_MODE] = () => onChangeViewMode(ViewMode.EDIT);
  navActions[TopNavIds.SAVE] = () => {
    const currentTitle = appState.title;
    const currentDescription = appState.description;
    const currentTimeRestore = appState.timeRestore;
    const onSave = async ({
      newTitle,
      newDescription,
      newCopyOnSave,
      newTimeRestore,
      newCopyPanels,
      newCopyPanelsTitleTemplate,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: {
      newTitle: string;
      newDescription: string;
      newCopyOnSave: boolean;
      newTimeRestore: boolean;
      newCopyPanels?: boolean;
      newCopyPanelsTitleTemplate?: string;
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

      // "Copy panels" only applies when saving as a new dashboard.
      const copyPanels = Boolean(newCopyOnSave && newCopyPanels);
      let copied: {
        originalPanels: typeof appState.panels;
        createdObjects: CreatedPanelCopy[];
        failures: PanelCopyFailure[];
      } | null = null;
      if (copyPanels) {
        // Detect a duplicate title BEFORE copying. On an unconfirmed duplicate,
        // copying first would create panel copies that the save then reverts, only
        // to re-copy them after the user confirms (a wasted 2N-create/N-delete
        // round-trip that can also leave orphans). Checking up front avoids that.
        //
        // The pre-check must see the object exactly as saveSavedObject will: with
        // copyOnSave set, the save deletes the id before running its own duplicate
        // check, so the self-match escape (duplicate.id === savedObject.id) only
        // holds there when the id is absent. Running this pre-check against the
        // live savedDashboard id would wrongly pass "copy keeps the source title"
        // (the most common duplicate), then the save would re-detect it and fire
        // the exact round-trip this guards against. Use a detached object literal
        // with id: undefined -- not a spread, which drops the prototype methods.
        try {
          await checkForDuplicateTitle(
            {
              id: undefined,
              title: newTitle,
              lastSavedTitle: savedDashboard.lastSavedTitle,
              copyOnSave: true,
              getDisplayName: () => savedDashboard.getDisplayName(),
              getOpenSearchType: () => savedDashboard.getOpenSearchType(),
            },
            isTitleDuplicateConfirmed,
            onTitleDuplicate,
            {
              savedObjectsClient: savedObjects.client,
              overlays,
            }
          );
        } catch (error) {
          // Restore the fields written on entry (matching the no-copy duplicate
          // path) so a cancelled duplicate or a failed check leaves no unsaved
          // title/description/timeRestore in app state.
          stateContainer.transitions.setDashboard({
            title: currentTitle,
            description: currentDescription,
            timeRestore: currentTimeRestore,
          });
          // A duplicate title is non-fatal: onTitleDuplicate has surfaced the
          // confirm UI. An empty id (no error) keeps the modal open for the user
          // to confirm, without copying.
          if (isErrorNonFatal(error as { message: string })) {
            return { id: '' } as SaveResult;
          }
          // A fatal check failure (e.g. the _find request failed) would otherwise
          // close the modal with no feedback; report it as the save path does.
          notifications.toasts.addDanger({
            title: i18n.translate('dashboard.topNav.saveModal.duplicateCheckErrorMessage', {
              defaultMessage: 'Could not check for a duplicate title. The dashboard was not saved.',
            }),
          });
          return { error: error as Error } as SaveResult;
        }
        // The pre-check used the same object shape the save will, so its verdict
        // is final: tell the save to skip its identical _find rather than repeat
        // the read. (On a confirmed duplicate this flag was already true.)
        saveOptions.isTitleDuplicateConfirmed = true;
        try {
          copied = await applyCopyPanels(savedObjects.client, stateContainer, {
            titleTemplate: newCopyPanelsTitleTemplate,
            dashboardTitle: newTitle,
          });
        } catch (error) {
          stateContainer.transitions.setDashboard({
            title: currentTitle,
            description: currentDescription,
            timeRestore: currentTimeRestore,
          });
          notifications.toasts.addDanger({
            title: i18n.translate('dashboard.topNav.saveModal.copyPanelsErrorMessage', {
              defaultMessage: 'Could not copy the dashboard panels. The dashboard was not saved.',
            }),
          });
          return { error: error as Error } as SaveResult;
        }
      }

      return save(saveOptions).then(async (response: SaveResult) => {
        // If the save wasn't successful, put the original values back.
        if (!(response as { id: string }).id) {
          stateContainer.transitions.setDashboard({
            title: currentTitle,
            description: currentDescription,
            timeRestore: currentTimeRestore,
          });
          if (copied) {
            await revertCopyPanels(
              savedObjects.client,
              stateContainer,
              copied.originalPanels,
              copied.createdObjects
            );
          }
        }

        // On a successful save-as, warn about any panels that could not be copied.
        if ((response as { id: string }).id && copied) {
          warnCopyPanelFailures(copied.failures);
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
    const onClone = async (
      newTitle: string,
      isTitleDuplicateConfirmed: boolean,
      onTitleDuplicate: () => void,
      copyPanels: boolean,
      titleTemplate?: string,
      signal?: AbortSignal
    ) => {
      savedDashboard.copyOnSave = true;
      stateContainer.transitions.set('title', newTitle);
      const saveOptions = {
        confirmOverwrite: false,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
      };

      // When "Copy panels" is selected, duplicate each by-reference panel's own
      // backing object and repoint the panels to the copies BEFORE saving, so the
      // cloned dashboard references the copies. Downstream references (index-pattern,
      // dataset, saved search, data-source) are kept shared. Layout/sections are
      // preserved because only the saved object id changes.
      let copied: {
        originalPanels: typeof appState.panels;
        createdObjects: CreatedPanelCopy[];
        failures: PanelCopyFailure[];
      } | null = null;
      if (copyPanels) {
        // Detect a duplicate title BEFORE copying (see the save-as path): avoids
        // copying, reverting, then re-copying after the user confirms a duplicate.
        //
        // Match the object shape saveSavedObject uses: copyOnSave deletes the id
        // before the save's own duplicate check, so the self-match escape only
        // holds with id absent. A pre-check against the live id would miss a clone
        // that keeps the source title and let the save re-trigger the round-trip.
        // Detached literal with id: undefined (a spread would drop the methods).
        try {
          await checkForDuplicateTitle(
            {
              id: undefined,
              title: newTitle,
              lastSavedTitle: savedDashboard.lastSavedTitle,
              copyOnSave: true,
              getDisplayName: () => savedDashboard.getDisplayName(),
              getOpenSearchType: () => savedDashboard.getOpenSearchType(),
            },
            isTitleDuplicateConfirmed,
            onTitleDuplicate,
            {
              savedObjectsClient: savedObjects.client,
              overlays,
            }
          );
        } catch (error) {
          // A duplicate title is non-fatal: onTitleDuplicate has surfaced the
          // confirm UI. An empty id (no error) keeps the clone modal open for the
          // user to confirm, without copying. showCloneModal keeps the modal open
          // only when the response has neither an id nor an error. The title is
          // left as the new title, matching the existing clone duplicate path.
          if (isErrorNonFatal(error as { message: string })) {
            return { id: '' };
          }
          // A fatal check failure would otherwise close the modal with no
          // feedback; restore the title and report it.
          stateContainer.transitions.set('title', currentTitle);
          notifications.toasts.addDanger({
            title: i18n.translate('dashboard.topNav.cloneModal.duplicateCheckErrorMessage', {
              defaultMessage:
                'Could not check for a duplicate title. The dashboard was not cloned.',
            }),
          });
          return { error: error as Error };
        }
        // The pre-check used the same object shape the save will, so its verdict
        // is final: tell the save to skip its identical _find. (Already true on a
        // confirmed duplicate.)
        saveOptions.isTitleDuplicateConfirmed = true;
        try {
          copied = await applyCopyPanels(savedObjects.client, stateContainer, {
            titleTemplate,
            dashboardTitle: newTitle,
            signal,
          });
        } catch (error) {
          stateContainer.transitions.set('title', currentTitle);
          // Cancellation is not an error -- stay silent and abort.
          if ((error as Error)?.name !== 'AbortError') {
            notifications.toasts.addDanger({
              title: i18n.translate('dashboard.topNav.cloneModal.copyPanelsErrorMessage', {
                defaultMessage:
                  'Could not copy the dashboard panels. The dashboard was not cloned.',
              }),
            });
          }
          return { error: error as Error };
        }
      }

      return save(saveOptions).then(async (response: { id?: string } | { error: Error }) => {
        const succeeded = Boolean((response as { id?: string }).id);
        // On any non-success (error or an unconfirmed duplicate title), undo the
        // copies so a retry starts clean and no orphan copies are left behind.
        if (!succeeded && copied) {
          await revertCopyPanels(
            savedObjects.client,
            stateContainer,
            copied.originalPanels,
            copied.createdObjects
          );
        }
        // If the save wasn't successful, put the original title back.
        if ((response as { error: Error }).error) {
          stateContainer.transitions.set('title', currentTitle);
        }
        // On a successful clone, warn about any panels that could not be copied.
        if (succeeded && copied) {
          warnCopyPanelFailures(copied.failures);
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

  // The first section claims existing panels; later sections start empty.
  navActions[TopNavIds.ADD_SECTION] = () => {
    if (!currentContainer || isErrorEmbeddable(currentContainer)) {
      return;
    }
    const input = currentContainer.getInput();
    const existing = input.layout;
    let createdName: string;
    if (!existing || existing.type !== 'SectionLayout' || existing.items.length === 0) {
      const firstSection = migrateAllPanelsToSection(input.panels);
      createdName = firstSection.name;
      currentContainer.reparentPanels(Object.keys(input.panels), {
        type: 'SectionLayout',
        items: [firstSection],
      });
    } else {
      const items = appendEmptySection(existing.items);
      createdName = items[items.length - 1].name;
      currentContainer.updateInput({
        layout: { type: 'SectionLayout', items },
      });
    }
    notifications.toasts.addSuccess({
      title: i18n.translate('dashboard.section.addSuccess', {
        defaultMessage: '"{name}" added to the end',
        values: { name: createdName },
      }),
      'data-test-subj': 'dashboardSectionAddedSuccess',
    });
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

      // Undefined restores GridLayout; a value restores the saved sections.
      newStateContainer.layout = dashboard.layout;

      // Recreate only panels whose grid owner changed; reparenting unaffected
      // live panels can leave their visualizations blank.
      const currentInput = currentContainer?.getInput();
      const currentLayout = currentInput?.layout;
      const savedLayout = dashboard.layout;
      const sectionsInvolved =
        currentLayout?.type === 'SectionLayout' || savedLayout?.type === 'SectionLayout';

      if (
        sectionsInvolved &&
        currentContainer &&
        currentInput &&
        !isErrorEmbeddable(currentContainer)
      ) {
        const sectionIdOf = (layout: any, panelId: string): string | undefined =>
          layout?.type === 'SectionLayout'
            ? layout.items.find((s: any) => s.members?.some((m: any) => m.idRef === panelId))?.id
            : undefined;

        const revertedPanels: { [key: string]: any } = {};
        (dashboard.panels || []).forEach((panel: any) => {
          revertedPanels[panel.panelIndex] = convertSavedDashboardPanelToPanelState(panel);
        });

        const currentIds = Object.keys(currentInput.panels);
        const idsToReparent = currentIds.filter(
          (id) =>
            !(id in revertedPanels) ||
            sectionIdOf(currentLayout, id) !== sectionIdOf(savedLayout, id)
        );

        if (idsToReparent.length > 0) {
          currentContainer.reparentPanels(idsToReparent, savedLayout as any, revertedPanels);
        }
      }

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
