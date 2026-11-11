/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
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

const getSavedObjectKey = (type: string, id: string) => `${type}:${id}`;

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
  const [savedObjectDetails, setSavedObjectDetails] = useState<SavedObjectWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const savedObjectRequests = useRef(new Map<string, Promise<SavedObjectWithMetadata>>());
  const latestLoad = useRef<Promise<Array<PromiseSettledResult<SavedObjectWithMetadata>>> | null>(
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
    onClick: () => {
      // Load on opening so history updates while open wait until the next opening.
      if (!isPopoverOpen) {
        loadSavedObjectDetails();
      }
      setIsPopoverOpen((prev) => !prev);
    },
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
        (item): item is ChromeRecentlyAccessedHistoryItem & { meta: { type: string } } =>
          !!item.meta?.type &&
          (!item.workspaceId ||
            // If the workspace id is existing but the workspace is deleted, filter the item
            workspaceList.some((workspace) => workspace.id === item.workspaceId))
      ),
    [recentlyAccessedItems, workspaceList]
  );

  const loadSavedObjectDetails = () => {
    const requests = savedObjectRequests.current;
    const promises = recentSavedObjects.map((item) => {
      const type = item.meta.type;
      const key = getSavedObjectKey(type, item.id);
      let request = requests.get(key);
      if (!request) {
        request = http
          .get<SavedObjectWithMetadata>(
            `/api/opensearch-dashboards/management/saved_objects/${encodeURIComponent(
              type
            )}/${encodeURIComponent(item.id)}`,
            {
              prependOptions: {
                withoutClientBasePath: true,
              },
            }
          )
          .then((object) => {
            if (object.error) {
              throw object.error;
            }
            return object;
          })
          .catch((error) => {
            if (requests.get(key) === request) {
              requests.delete(key);
            }
            throw error;
          });
        requests.set(key, request);
      }
      return request;
    });

    const load = Promise.allSettled(promises);
    latestLoad.current = load;
    setIsLoading(promises.length > 0);
    load.then((results) => {
      // An older opening must not overwrite the latest list or hide the spinner
      // while the newer opening is still waiting for added objects.
      if (latestLoad.current !== load) {
        return;
      }
      setSavedObjectDetails(
        results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
      );
      setIsLoading(false);
    });
  };

  useEffect(() => {
    // Drop entries that leave recent history or belong to unavailable workspaces.
    // This bounds the map; returning items are fetched again on the next opening.
    const keys = new Set(
      recentSavedObjects.map((item) => getSavedObjectKey(item.meta.type, item.id))
    );
    for (const key of savedObjectRequests.current.keys()) {
      if (!keys.has(key)) {
        savedObjectRequests.current.delete(key);
      }
    }
  }, [recentSavedObjects]);

  useEffect(
    () => () => {
      // Closing retains requests; unmounting prevents their completions from updating state.
      latestLoad.current = null;
      savedObjectRequests.current.clear();
    },
    []
  );

  const detailedSavedObjects = useMemo<DetailedRecentlyAccessedItem[]>(
    () =>
      recentSavedObjects.flatMap((item) => {
        const obj = savedObjectDetails.find(
          (detail) => detail.type === item.meta.type && detail.id === item.id
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
        {isLoading ? (
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
