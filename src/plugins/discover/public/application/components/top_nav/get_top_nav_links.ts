/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DiscoverViewServices } from '../../../build_services';
import { showOpenSearchPanel } from './show_open_search_panel';
import { SavedSearch } from '../../../saved_searches';
import { NEW_DISCOVER_APP } from '../../..';
import { Adapters } from '../../../../../inspector/public';

export const getTopNavLinks = (
  services: DiscoverViewServices,
  inspectorAdapters: Adapters,
  savedSearch?: SavedSearch
) => {
  const { history, inspector, core, uiSettings, capabilities } = services;

  const newSearch = {
    id: 'new',
    label: i18n.translate('discover.localMenu.localMenu.newSearchTitle', {
      defaultMessage: 'New',
    }),
    description: i18n.translate('discover.localMenu.newSearchDescription', {
      defaultMessage: 'New Search',
    }),
    run() {
      setTimeout(() => {
        history().push('/');
      }, 0);
    },
    testId: 'discoverNewButton',
  };

  // const saveSearch = {
  //   id: 'save',
  //   label: i18n.translate('discover.localMenu.saveTitle', {
  //     defaultMessage: 'Save',
  //   }),
  //   description: i18n.translate('discover.localMenu.saveSearchDescription', {
  //     defaultMessage: 'Save Search',
  //   }),
  //   testId: 'discoverSaveButton',
  //   run: async () => {
  //     const onSave = ({
  //       newTitle,
  //       newCopyOnSave,
  //       isTitleDuplicateConfirmed,
  //       onTitleDuplicate,
  //     }) => {
  //       const currentTitle = savedSearch.title;
  //       savedSearch.title = newTitle;
  //       savedSearch.copyOnSave = newCopyOnSave;
  //       const saveOptions = {
  //         confirmOverwrite: false,
  //         isTitleDuplicateConfirmed,
  //         onTitleDuplicate,
  //       };
  //       return saveDataSource(saveOptions).then((response) => {
  //         // If the save wasn't successful, put the original values back.
  //         if (!response.id || response.error) {
  //           savedSearch.title = currentTitle;
  //         } else {
  //           resetInitialAppState();
  //         }
  //         return response;
  //       });
  //     };

  //     const saveModal = (
  //       <SavedObjectSaveModal
  //         onSave={onSave}
  //         onClose={() => {}}
  //         title={savedSearch.title}
  //         showCopyOnSave={!!savedSearch.id}
  //         objectType="search"
  //         description={i18n.translate('discover.localMenu.saveSaveSearchDescription', {
  //           defaultMessage:
  //             'Save your Discover search so you can use it in visualizations and dashboards',
  //         })}
  //         showDescription={false}
  //       />
  //     );
  //     showSaveModal(saveModal, core.i18n.Context);
  //   },
  // };

  const openSearch = {
    id: 'open',
    label: i18n.translate('discover.localMenu.openTitle', {
      defaultMessage: 'Open',
    }),
    description: i18n.translate('discover.localMenu.openSavedSearchDescription', {
      defaultMessage: 'Open Saved Search',
    }),
    testId: 'discoverOpenButton',
    run: () => {
      showOpenSearchPanel({
        makeUrl: (searchId) => `#/view/${encodeURIComponent(searchId)}`,
        I18nContext: core.i18n.Context,
      });
    },
  };

  //   const shareSearch = {
  //     id: 'share',
  //     label: i18n.translate('discover.localMenu.shareTitle', {
  //       defaultMessage: 'Share',
  //     }),
  //     description: i18n.translate('discover.localMenu.shareSearchDescription', {
  //       defaultMessage: 'Share Search',
  //     }),
  //     testId: 'shareTopNavButton',
  //     run: async (anchorElement) => {
  //       const sharingData = await this.getSharingData();
  //       share.toggleShareContextMenu({
  //         anchorElement,
  //         allowEmbed: false,
  //         allowShortUrl: uiCapabilities.discover.createShortUrl,
  //         shareableUrl: unhashUrl(window.location.href),
  //         objectId: savedSearch.id,
  //         objectType: 'search',
  //         sharingData: {
  //           ...sharingData,
  //           title: savedSearch.title,
  //         },
  //         isDirty: !savedSearch.id || isAppStateDirty(),
  //       });
  //     },
  //   };

  const inspectSearch = {
    id: 'inspect',
    label: i18n.translate('discover.localMenu.inspectTitle', {
      defaultMessage: 'Inspect',
    }),
    description: i18n.translate('discover.localMenu.openInspectorForSearchDescription', {
      defaultMessage: 'Open Inspector for search',
    }),
    testId: 'openInspectorButton',
    run() {
      inspector.open(inspectorAdapters, {
        title: savedSearch?.title,
      });
    },
  };

  const legacyDiscover = {
    id: 'discover-new',
    label: i18n.translate('discover.localMenu.legacyDiscoverTitle', {
      defaultMessage: 'Legacy Discover',
    }),
    description: i18n.translate('discover.localMenu.newDiscoverDescription', {
      defaultMessage: 'New Discover Experience',
    }),
    testId: 'discoverNewButton',
    run: async () => {
      await uiSettings.set(NEW_DISCOVER_APP, false);
      window.location.reload();
    },
  };

  return [
    legacyDiscover,
    newSearch,
    // ...(uiCapabilities.discover.save ? [saveSearch] : []),
    openSearch,
    // shareSearch,
    inspectSearch,
  ];
};
