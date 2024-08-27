/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState, useEffect } from 'react';
import * as Rx from 'rxjs';
import moment from 'moment';
import {
  EuiPanel,
  EuiListGroup,
  EuiListGroupItem,
  EuiTitle,
  EuiPopoverTitle,
  EuiIcon,
  EuiText,
  EuiButtonEmpty,
  EuiSpacer,
  EuiHeaderSectionItemButtonProps,
  EuiButtonIcon,
  EuiRadioGroup,
  EuiTextColor,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import { SavedObjectsNamespaceType } from 'src/core/public';
import { ChromeRecentlyAccessedHistoryItem, SavedObject } from 'opensearch-dashboards/public';
import { WorkspaceObject } from '../../../workspace';
import { HttpStart } from '../../../http';
import { createRecentNavLink } from './nav_link';
import { ChromeNavLink } from '../../../';
import './recent_items.scss';

const widthForRightMargin = 8;

export interface Props {
  recentlyAccessed$: Rx.Observable<ChromeRecentlyAccessedHistoryItem[]>;
  workspaceList$: Rx.Observable<WorkspaceObject[]>;
  navigateToUrl: (url: string) => Promise<void>;
  basePath: HttpStart['basePath'];
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  renderBreadcrumbs: React.JSX.Element;
  buttonSize?: EuiHeaderSectionItemButtonProps['size'];
  http: HttpStart;
}

interface SavedObjectMetadata {
  icon?: string;
  title?: string;
  editUrl?: string;
  inAppUrl?: { path: string; uiCapabilitiesPath: string };
  namespaceType?: SavedObjectsNamespaceType;
}
export type SavedObjectWithMetadata<T = unknown> = SavedObject<T> & {
  meta: SavedObjectMetadata;
};

type DetailedRecentlyAccessedItem = ChromeRecentlyAccessedHistoryItem &
  SavedObjectWithMetadata &
  ChromeRecentlyAccessedHistoryItem['meta'] & {
    updatedAt: number;
    workspaceName?: string;
  };

const bulkGetDetail = (savedObjects: Array<Pick<SavedObject, 'type' | 'id'>>, http: HttpStart) => {
  return Promise.all(
    savedObjects.map((obj) =>
      http
        .get<SavedObjectWithMetadata>(
          `/api/opensearch-dashboards/management/saved_objects/${encodeURIComponent(
            obj.type
          )}/${encodeURIComponent(obj.id)}`
        )
        .catch((error) => ({
          id: obj.id,
          type: obj.type,
          error,
          attributes: {},
          references: [],
          meta: {},
          updated_at: '',
        }))
    )
  );
};

const recentsRadios = [
  {
    id: '5',
    label: '5 pages',
  },
  {
    id: '10',
    label: '10 pages',
  },
  {
    id: '15',
    label: '15 pages',
  },
];

export const RecentItems = ({
  recentlyAccessed$,
  workspaceList$,
  navigateToUrl,
  navLinks$,
  basePath,
  renderBreadcrumbs,
  buttonSize = 's',
  http,
}: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isPreferencesPopoverOpen, setIsPreferencesPopoverOpen] = useState(false);
  const recentlyAccessedItems = useObservable(recentlyAccessed$, []);
  const [recentsRadioIdSelected, setRecentsRadioIdSelected] = useState(recentsRadios[0].id);
  const workspaceList = useObservable(workspaceList$, []);
  const [detailedSavedObjects, setDetailedSavedObjects] = useState<DetailedRecentlyAccessedItem[]>(
    []
  );
  const navLinks = useObservable(navLinks$, []).filter((link) => !link.hidden);

  const handleItemClick = (link: string) => {
    navigateToUrl(link);
    setIsPopoverOpen(false);
  };

  const preferencePopover = (
    <EuiPopover
      data-test-subj="preferencesSettingPopover"
      ownFocus={false}
      panelPaddingSize="s"
      button={
        <EuiButtonEmpty
          data-test-subj="preferencesSettingButton"
          flush="left"
          color="primary"
          onClick={() => {
            setIsPreferencesPopoverOpen((IsPreferencesPopoverOpe) => !IsPreferencesPopoverOpe);
          }}
        >
          Preferences
        </EuiButtonEmpty>
      }
      isOpen={isPreferencesPopoverOpen}
      anchorPosition="downLeft"
      closePopover={() => {
        setIsPreferencesPopoverOpen(false);
      }}
    >
      <EuiPopoverTitle>Preferences</EuiPopoverTitle>
      <EuiRadioGroup
        options={recentsRadios}
        idSelected={recentsRadioIdSelected}
        onChange={(id) => {
          setRecentsRadioIdSelected(id);
          setIsPreferencesPopoverOpen(false);
        }}
        name="radio group"
        legend={{
          children: <span>Recents</span>,
        }}
      />
    </EuiPopover>
  );
  const recentButton = (
    <EuiToolTip
      content={i18n.translate('core.ui.chrome.headerGlobalNav.viewRecentItemsTooltip', {
        defaultMessage: 'Recent',
      })}
      delay="long"
      position="bottom"
    >
      <EuiButtonIcon
        iconType="recent"
        color="text"
        size="xs"
        aria-expanded={isPopoverOpen}
        aria-haspopup="true"
        aria-label={i18n.translate('core.ui.chrome.headerGlobalNav.viewRecentItemsAriaLabel', {
          defaultMessage: 'View recents',
        })}
        onClick={() => {
          setIsPopoverOpen((prev) => !prev);
        }}
        data-test-subj="recentItemsSectionButton"
        className="headerRecentItemsButton"
      />
    </EuiToolTip>
  );

  useEffect(() => {
    const savedObjects = recentlyAccessedItems
      .filter((item) => item.meta?.type)
      .map((item) => ({
        type: item.meta?.type || '',
        id: item.id,
      }));

    if (savedObjects.length) {
      bulkGetDetail(savedObjects, http).then((res) => {
        const formatDetailedSavedObjects = res.map((obj) => {
          const recentAccessItem = recentlyAccessedItems.find(
            (item) => item.id === obj.id
          ) as ChromeRecentlyAccessedHistoryItem;

          const findWorkspace = workspaceList.find(
            (workspace) => workspace.id === recentAccessItem.workspaceId
          );
          return {
            ...recentAccessItem,
            ...obj,
            ...recentAccessItem.meta,
            updatedAt: moment(obj?.updated_at).valueOf(),
            workspaceName: findWorkspace?.name,
            link: createRecentNavLink(recentAccessItem, navLinks, basePath, navigateToUrl).href,
          };
        });
        // here I write this argument to avoid Unnecessary re-rendering
        if (JSON.stringify(formatDetailedSavedObjects) !== JSON.stringify(detailedSavedObjects)) {
          setDetailedSavedObjects(formatDetailedSavedObjects);
        }
      });
    }
  }, [
    navLinks,
    basePath,
    navigateToUrl,
    recentlyAccessedItems,
    http,
    workspaceList,
    detailedSavedObjects,
  ]);

  const selectedRecentsItems = useMemo(() => {
    return detailedSavedObjects.slice(0, Number(recentsRadioIdSelected));
  }, [detailedSavedObjects, recentsRadioIdSelected]);

  return (
    <EuiPopover
      button={recentButton}
      isOpen={isPopoverOpen}
      closePopover={() => {
        setIsPopoverOpen(false);
      }}
      anchorPosition="downCenter"
      repositionOnScroll
      initialFocus={false}
      panelPaddingSize="m"
    >
      {renderBreadcrumbs}
      <EuiSpacer size="s" />
      <EuiPanel
        hasShadow={false}
        hasBorder={false}
        paddingSize="none"
        style={{ maxHeight: '35vh', overflow: 'auto' }}
      >
        <EuiTitle size="xxs">
          <h4>Recent</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        {selectedRecentsItems.length > 0 ? (
          <EuiListGroup flush={true} gutterSize="s">
            {selectedRecentsItems.map((item) => (
              <EuiListGroupItem
                onClick={() => handleItemClick(item.link)}
                key={item.link}
                style={{ padding: '1px' }}
                label={
                  <>
                    <EuiIcon
                      style={{ marginRight: widthForRightMargin }}
                      type={item.meta.icon || 'apps'}
                    />
                    {item.label}
                    {item.workspaceName ? (
                      <EuiTextColor color="subdued">({item.workspaceName})</EuiTextColor>
                    ) : null}
                  </>
                }
                color="text"
                size="s"
              />
            ))}
          </EuiListGroup>
        ) : (
          <EuiText color="subdued" size="s">
            No recently viewed items
          </EuiText>
        )}
        <EuiSpacer size="s" />
      </EuiPanel>
      {preferencePopover}
    </EuiPopover>
  );
};
