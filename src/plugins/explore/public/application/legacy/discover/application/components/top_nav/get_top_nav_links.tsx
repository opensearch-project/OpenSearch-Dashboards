/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { ExploreServices } from '../../../../../../types';
import { SavedExplore } from '../../../../../../saved_explore';
import { TopNavMenuData, TopNavMenuIconData } from '../../../../../../../../navigation/public';
import { ISearchSource, unhashUrl } from '../../../opensearch_dashboards_services';
import {
  OnSaveProps,
  SavedObjectSaveModal,
  SaveResult,
  showSaveModal,
} from '../../../../../../../../saved_objects/public';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../../../../../../opensearch_dashboards_react/public';
import { LegacyState, setSavedSearch } from '../../../../../utils/state_management/slices';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
} from '../../../../../../../common/legacy/discover';
import { getSortForSearchSource } from '../../view_components/utils/get_sort_for_search_source';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';
import { OpenSearchPanel } from './open_search_panel';
import { ExecutionContextSearch } from '../../../../../../../../expressions';
import { IndexPattern } from '../../../../../../../../data/public';
import { Query } from '../../../../../../../../data/public';
import { resetExploreStateActionCreator } from '../../../../../utils/state_management/actions/reset_explore_state';

export const getTopNavLinks = (
  services: ExploreServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  indexPattern: IndexPattern | undefined,
  savedExplore?: SavedExplore
) => {
  const {
    history,
    core,
    capabilities,
    share,
    toastNotifications,
    chrome,
    store,
    data: { search },
  } = services;

  const topNavLinksMap = new Map<string, TopNavMenuData>();

  // New
  const newSearch: TopNavMenuIconData = {
    tooltip: i18n.translate('explore.discover.localMenu.localMenu.newSearchTitle', {
      defaultMessage: 'New',
    }),
    run() {
      store.dispatch(resetExploreStateActionCreator(services));
    },
    testId: 'discoverNewButton',
    ariaLabel: i18n.translate('explore.discover.topNav.discoverNewButtonLabel', {
      defaultMessage: `New Search`,
    }),
    iconType: 'plusInCircle',
    controlType: 'icon',
  };
  topNavLinksMap.set('new', newSearch);

  // Open
  const openSearch: TopNavMenuIconData = {
    tooltip: i18n.translate('explore.discover.localMenu.openTitle', {
      defaultMessage: 'Open',
    }),
    testId: 'discoverOpenButton',
    ariaLabel: i18n.translate('explore.discover.topNav.discoverOpenButtonLabel', {
      defaultMessage: `Open Saved Search`,
    }),
    run: () => {
      const flyoutSession = services.overlays.openFlyout(
        toMountPoint(
          <OpenSearchDashboardsContextProvider services={services}>
            <OpenSearchPanel
              onClose={() => flyoutSession?.close?.().then()}
              makeUrl={(searchId) => `#/view/${encodeURIComponent(searchId)}`}
            />
          </OpenSearchDashboardsContextProvider>
        )
      );
    },
    iconType: 'folderOpen',
    controlType: 'icon',
  };
  topNavLinksMap.set('open', openSearch);

  // Save
  if (capabilities.discover?.save) {
    const saveSearch: TopNavMenuIconData = {
      tooltip: i18n.translate('explore.discover.localMenu.saveTitle', {
        defaultMessage: 'Save',
      }),
      testId: 'discoverSaveButton',
      ariaLabel: i18n.translate('explore.explore.discover.topNav.discoverSaveButtonLabel', {
        defaultMessage: `Save search`,
      }),
      run: async () => {
        if (!savedExplore) return;
        const onSave = async ({
          newTitle,
          newCopyOnSave,
          isTitleDuplicateConfirmed,
          onTitleDuplicate,
        }: OnSaveProps): Promise<SaveResult | undefined> => {
          const currentTitle = savedExplore.title;
          savedExplore.title = newTitle;
          savedExplore.copyOnSave = newCopyOnSave;
          const saveOptions = {
            confirmOverwrite: false,
            isTitleDuplicateConfirmed,
            onTitleDuplicate,
          };

          // TODO: remove legacy state once data flow is migrated
          // @ts-expect-error TODO: Fix me
          const state: LegacyState = store.getState().legacy; // store is defined before the view is loaded
          savedExplore.columns = state.columns;
          savedExplore.sort = state.sort;

          // Use transform approach similar to vis_builder - serialize state into saved object
          const { updateLegacyPropertiesInSavedObject } = await import(
            '../../../../../../saved_explore/transforms'
          );
          updateLegacyPropertiesInSavedObject(savedExplore, {
            columns: state.columns,
            sort: state.sort,
          });

          // TODO: SearchSource should be saved in savedExplore instead of constructing it here
          // Here constructing it for saving
          const searchSource = search.searchSource.createEmpty();
          searchSource.setField('query', searchContext.query as Query);
          searchSource.setField('filter', searchContext.filters);
          searchSource.setField('index', indexPattern);
          savedExplore.searchSource = searchSource;

          try {
            const id = await savedExplore.save(saveOptions);

            // If the title is a duplicate, the id will be an empty string. Checking for this condition here
            if (id) {
              toastNotifications.addSuccess({
                title: i18n.translate('explore.explore.discover.notifications.savedExploreTitle', {
                  defaultMessage: `Search '{savedExploreTitle}' was saved`,
                  values: {
                    savedExploreTitle: savedExplore.title,
                  },
                }),
                'data-test-subj': 'saveSearchSuccess',
              });

              if (id !== state.savedSearch) {
                history().push(`/view/${encodeURIComponent(id)}`);
              } else {
                chrome.docTitle.change(savedExplore.lastSavedTitle);
                chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedExplore.title }]);
              }

              // set App state to clean
              store.dispatch(setSavedSearch(id));

              // starts syncing `_g` portion of url with query services
              startSyncingQueryStateWithUrl();

              return { id };
            }
          } catch (error) {
            toastNotifications.addDanger({
              title: i18n.translate('explore.explore.discover.notifications.notSavedExploreTitle', {
                defaultMessage: `Search '{savedExploreTitle}' was not saved.`,
                values: {
                  savedExploreTitle: savedExplore.title,
                },
              }),
              text: (error as Error).message,
            });

            // Reset the original title
            savedExplore.title = currentTitle;

            return { error };
          }
        };

        const saveModal = (
          <SavedObjectSaveModal
            onSave={onSave}
            onClose={() => {}}
            title={savedExplore.title ?? ''}
            showCopyOnSave={!!savedExplore.id}
            objectType="search"
            description={i18n.translate(
              'explore.explore.discover.localMenu.saveSaveSearchDescription',
              {
                defaultMessage:
                  'Save your Discover search so you can use it in visualizations and dashboards',
              }
            )}
            showDescription={false}
          />
        );
        showSaveModal(saveModal, core.i18n.Context);
      },
      iconType: 'save',
      controlType: 'icon',
    };
    topNavLinksMap.set('save', saveSearch);
  }

  // Share
  if (share) {
    const shareSearch: TopNavMenuIconData = {
      tooltip: i18n.translate('explore.explore.discover.localMenu.shareTitle', {
        defaultMessage: 'Share',
      }),
      testId: 'shareTopNavButton',
      ariaLabel: i18n.translate('explore.explore.discover.topNav.discoverShareButtonLabel', {
        defaultMessage: `Share search`,
      }),
      run: async (anchorElement) => {
        if (!savedExplore) return;
        // @ts-expect-error TODO: Fix me
        const state: LegacyState = store.getState().legacy; // store is defined before the view is loaded
        const sharingData = await getSharingData({
          searchSource: savedExplore.searchSource,
          state,
          services,
        });
        share?.toggleShareContextMenu({
          anchorElement,
          allowEmbed: false,
          allowShortUrl: capabilities.discover?.createShortUrl as boolean,
          shareableUrl: unhashUrl(window.location.href),
          objectId: savedExplore.id,
          objectType: 'search',
          sharingData: {
            ...sharingData,
            title: savedExplore.title,
          },
          isDirty: !savedExplore.id || state.isDirty || false,
        });
      },
      iconType: 'share',
      controlType: 'icon',
    };
    topNavLinksMap.set('share', shareSearch);
  }

  // Order their appearance
  return ['save', 'open', 'new', 'share'].reduce((acc, item) => {
    const itemDef = topNavLinksMap.get(item);
    if (itemDef) {
      acc.push(itemDef);
    }
    return acc;
  }, [] as TopNavMenuData[]);
};

// TODO: This does not seem to affect the share menu. need to look into it in future
// const getFieldCounts = async () => {
//   // the field counts aren't set until we have the data back,
//   // so we wait for the fetch to be done before proceeding
//   if ($scope.fetchStatus === fetchStatuses.COMPLETE) {
//     return $scope.fieldCounts;
//   }

//   return await new Promise((resolve) => {
//     const unwatch = $scope.$watch('fetchStatus', (newValue) => {
//       if (newValue === fetchStatuses.COMPLETE) {
//         unwatch();
//         resolve($scope.fieldCounts);
//       }
//     });
//   });
// };

const getSharingDataFields = async (
  selectedFields: string[],
  hideTimeColumn: boolean,
  timeFieldName?: string
) => {
  if (selectedFields.length === 1 && selectedFields[0] === '_source') {
    // const fieldCounts = await getFieldCounts();
    return {
      searchFields: undefined,
      // selectFields: keys(fieldCounts).sort(),
    };
  }

  const fields =
    timeFieldName && !hideTimeColumn ? [timeFieldName, ...selectedFields] : selectedFields;
  return {
    searchFields: fields,
    selectFields: fields,
  };
};

const getSharingData = async ({
  searchSource,
  state,
  services,
}: {
  searchSource: ISearchSource;
  state: LegacyState;
  services: ExploreServices;
}) => {
  const searchSourceInstance = searchSource.createCopy();
  const indexPattern = await searchSourceInstance.getField('index');

  const { searchFields } = await getSharingDataFields(
    state.columns,
    services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false),
    indexPattern?.timeFieldName
  );

  searchSourceInstance.setField('fields', searchFields);
  searchSourceInstance.setField(
    'sort',
    getSortForSearchSource(
      state.sort,
      indexPattern,
      services.uiSettings.get(SORT_DEFAULT_ORDER_SETTING, 'desc')
    )
  );
  searchSourceInstance.setField('highlight', null);
  searchSourceInstance.setField('highlightAll', undefined);
  searchSourceInstance.setField('aggs', null);
  searchSourceInstance.setField('size', undefined);

  const body = await searchSource.getSearchRequestBody();
  return {
    searchRequest: {
      index: indexPattern?.title,
      body,
    },
    // fields: selectFields,
    metaFields: indexPattern?.metaFields,
    conflictedTypesFields: indexPattern?.fields
      .filter((f) => f.type === 'conflict')
      .map((f) => f.name),
    indexPatternId: indexPattern?.id,
  };
};
