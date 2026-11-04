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
  EuiLoadingSpinner,
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
import { LoadingIndicator } from '../loading_indicator';
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
  loadingCount$: Rx.Observable<number>;
  workspaceEnabled?: boolean;
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
          )}/${encodeURIComponent(obj.id)}`,
          {
            prependOptions: {
              withoutClientBasePath: true,
            },
          }
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
  loadingCount$,
  workspaceEnabled,
}: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isPreferencesPopoverOpen, setIsPreferencesPopoverOpen] = useState(false);
  const recentlyAccessedItems = useObservable(recentlyAccessed$, []);
  const [recentsRadioIdSelected, setRecentsRadioIdSelected] = useState(recentsRadios[0].id);
  const workspaceList = useObservable(workspaceList$, []);
  const [savedObjectDetails, setSavedObjectDetails] = useState<SavedObjectWithMetadata[] | null>(
    null
  );
  const navLinks = useObservable(navLinks$, []);
  const loadingCount = useObservable(loadingCount$, 0);

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
        <EuiButtonIcon
          color="primary"
          size="xs"
          onClick={() => {
            setIsPreferencesPopoverOpen((IsPreferencesPopoverOpe) => !IsPreferencesPopoverOpe);
          }}
          iconType="managementApp"
          data-test-subj="preferencesSettingButton"
          aria-label={i18n.translate('core.header.recent.preferences.buttonAriaLabel', {
            defaultMessage: 'Preferences setting',
          })}
        />
      }
      isOpen={isPreferencesPopoverOpen}
      anchorPosition="downLeft"
      closePopover={() => {
        setIsPreferencesPopoverOpen(false);
      }}
    >
      <EuiPopoverTitle>
        {i18n.translate('core.header.recent.preferences.title', {
          defaultMessage: 'Preferences',
        })}
      </EuiPopoverTitle>
      <EuiRadioGroup
        options={recentsRadios}
        idSelected={recentsRadioIdSelected}
        onChange={(id) => {
          setRecentsRadioIdSelected(id);
          setIsPreferencesPopoverOpen(false);
        }}
        name="radio group"
        legend={{
          children: (
            <span>
              {i18n.translate('core.header.recent.preferences.legend', {
                defaultMessage: 'Recents',
              })}
            </span>
          ),
        }}
      />
    </EuiPopover>
  );

  const recentButtonCommonProps = {
    'aria-expanded': isPopoverOpen,
    'aria-label': i18n.translate('core.ui.chrome.headerGlobalNav.viewRecentItemsAriaLabel', {
      defaultMessage: 'View recents',
    }),
    onClick: () => setIsPopoverOpen((prev) => !prev),
    'data-test-subj': 'recentItemsSectionButton',
  };
  const recentButton = (
    <EuiToolTip
      content={i18n.translate('core.ui.chrome.headerGlobalNav.viewRecentItemsTooltip', {
        defaultMessage: 'Recent',
      })}
      delay="long"
      position="bottom"
    >
      {!(loadingCount > 0) ? (
        <EuiButtonIcon
          iconType="recent"
          color="text"
          size="xs"
          aria-haspopup="true"
          className="headerRecentItemsButton"
          {...recentButtonCommonProps}
        />
      ) : (
        <EuiButtonEmpty
          size="xs"
          aria-haspopup="true"
          className="headerRecentItemsButton headerRecentItemsButton--loadingIndicator"
          {...recentButtonCommonProps}
        >
          <LoadingIndicator loadingCount$={loadingCount$} />
        </EuiButtonEmpty>
      )}
    </EuiToolTip>
  );

  const recentSavedObjects = useMemo(
    () =>
      recentlyAccessedItems.filter(
        (item) =>
          item.meta?.type &&
          (!item.workspaceId ||
            // If the workspace id is existing but the workspace is deleted, filter the item
            workspaceList.some((workspace) => workspace.id === item.workspaceId))
      ),
    [recentlyAccessedItems, workspaceList]
  );
  // Only changes to the requested objects require loading details again.
  // History order, access times, and workspace names are presentation data.
  const savedObjectIds = JSON.stringify(
    recentSavedObjects
      .map((item) => ({
        type: item.meta?.type || '',
        id: item.id,
      }))
      .sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id))
  );

  useEffect(() => {
    // Details belong to this opening of the popover, never to a later opening.
    setSavedObjectDetails(null);
    if (!isPopoverOpen) {
      return;
    }

    let cancelled = false;
    const savedObjects: Array<Pick<SavedObject, 'type' | 'id'>> = JSON.parse(savedObjectIds);
    if (savedObjects.length) {
      bulkGetDetail(savedObjects, http).then((res) => {
        if (!cancelled) {
          setSavedObjectDetails(res.filter((obj) => !obj.error));
        }
      });
    } else {
      setSavedObjectDetails([]);
    }

    return () => {
      cancelled = true;
    };
  }, [isPopoverOpen, http, savedObjectIds]);

  const detailedSavedObjects = useMemo<DetailedRecentlyAccessedItem[]>(
    () =>
      recentSavedObjects.flatMap((item) => {
        const obj = savedObjectDetails?.find(
          (detail) => detail.id === item.id && detail.type === item.meta?.type
        );
        if (!obj) {
          return [];
        }

        return [
          {
            ...item,
            ...obj,
            ...item.meta,
            updatedAt: moment(obj.updated_at).valueOf(),
            workspaceName: workspaceList.find((workspace) => workspace.id === item.workspaceId)
              ?.name,
          },
        ];
      }),
    [recentSavedObjects, savedObjectDetails, workspaceList]
  );

  const selectedRecentItems = useMemo(() => {
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
      <EuiSpacer size="m" />
      <EuiPanel
        hasShadow={false}
        hasBorder={false}
        paddingSize="none"
        style={{ maxHeight: '35vh' }}
        className="euiYScrollWithShadows"
      >
        <EuiTitle size="xxs">
          <h4>
            {i18n.translate('core.header.recent.title', {
              defaultMessage: 'Recent assets',
            })}
          </h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        {savedObjectDetails === null && recentSavedObjects.length > 0 ? (
          <EuiLoadingSpinner
            size="m"
            aria-label={i18n.translate('core.header.recent.loading', {
              defaultMessage: 'Loading recent items',
            })}
          />
        ) : selectedRecentItems.length > 0 ? (
          <EuiListGroup flush={true} gutterSize="s">
            {selectedRecentItems.map((item) => (
              <EuiListGroupItem
                onClick={() =>
                  handleItemClick(
                    createRecentNavLink(
                      item,
                      navLinks.filter((link) => !link.hidden),
                      basePath,
                      navigateToUrl,
                      !!workspaceEnabled
                    ).href
                  )
                }
                key={item.link}
                style={{ padding: '1px' }}
                label={
                  <>
                    <EuiIcon
                      style={{ marginRight: widthForRightMargin }}
                      type={item.meta.icon || 'apps'}
                      color="text"
                    />
                    {item.label + ' '}
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
            {i18n.translate('core.header.recent.no.recents', {
              defaultMessage: 'No recently viewed items',
            })}
          </EuiText>
        )}
        <EuiSpacer size="m" />
      </EuiPanel>
      {preferencePopover}
    </EuiPopover>
  );
};
