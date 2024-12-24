/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment';
import {
  EuiFlexItem,
  EuiCard,
  EuiPanel,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFilterGroup,
  EuiFilterButton,
  EuiComboBox,
  EuiIcon,
  EuiLink,
  EuiEmptyPrompt,
  EuiToolTip,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiLoadingLogo,
  EuiSmallButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ChromeRecentlyAccessedHistoryItem,
  CoreStart,
  SavedObject,
  SavedObjectsFindOptions,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { SavedObjectWithMetadata } from 'src/plugins/saved_objects_management/common';
import { formatUrlWithWorkspaceId } from '../../../../core/public/utils';
import { APP_ID } from '../plugin';
import { findObjects } from '../lib';

const allOption = i18n.translate('savedObjectsManagement.recentWorkSection.all.items', {
  defaultMessage: 'All items',
});

const recentlyViewed = i18n.translate('savedObjectsManagement.recentWorkSection.recentlyViewed', {
  defaultMessage: 'Recently viewed',
});

const recentlyUpdated = i18n.translate('savedObjectsManagement.recentWorkSection.recentlyUpdated', {
  defaultMessage: 'Recently updated',
});

const sortKeyMap = {
  [recentlyViewed]: 'lastAccessedTime',
  [recentlyUpdated]: 'updatedAt',
} as const;

type KeyOf<T> = keyof T;

function sortBy<T>(key: KeyOf<T>) {
  return (a: T, b: T): number => (a[key] > b[key] ? -1 : b[key] > a[key] ? 1 : 0);
}

type DetailedRecentlyAssetsItem = Partial<ChromeRecentlyAccessedHistoryItem> &
  SavedObjectWithMetadata &
  ChromeRecentlyAccessedHistoryItem['meta'] & {
    updatedAt: number;
    workspaceName?: string;
  };

const bulkGetDetail = (
  savedObjects: Array<Pick<SavedObject, 'type' | 'id'>>,
  http: CoreStart['http']
) => {
  return Promise.all(
    savedObjects.map((obj) =>
      http
        .get<SavedObjectWithMetadata>(
          `/api/opensearch-dashboards/management/saved_objects/${encodeURIComponent(
            obj.type
          )}/${encodeURIComponent(obj.id)}`
        )
        .catch(
          (error) =>
            ({
              id: obj.id,
              type: obj.type,
              error,
              attributes: {},
              references: [],
              meta: {},
              updated_at: '',
            } as SavedObjectWithMetadata)
        )
    )
  );
};

const widthForTypeSelector = 220;
const widthForRightMargin = 4;
const MAX_ITEMS_DISPLAY = 6;

export const RecentWork = (props: { core: CoreStart; workspaceEnabled?: boolean }) => {
  const { core, workspaceEnabled } = props;
  const recently$Ref = useRef(core.chrome.recentlyAccessed.get$());
  const recentAccessed = useObservable(recently$Ref.current, []);
  const workspaceList = useObservable(core.workspaces.workspaceList$, []);
  const currentWorkspace = useObservable(core.workspaces.currentWorkspace$, null);
  const [selectedType, setSelectedType] = useState(allOption);
  const [selectedSort, setSelectedSort] = useState(recentlyViewed);
  const [detailedSavedObjects, setDetailedSavedObjects] = useState<DetailedRecentlyAssetsItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const useUpdatedUX = core.chrome.navGroup.getNavGroupEnabled();

  const allOptions = useMemo(() => {
    const options: string[] = [allOption];
    detailedSavedObjects
      .filter((item) => !item.error)
      .forEach((recentAccessItem) => {
        if (recentAccessItem?.type && options.indexOf(recentAccessItem?.type) === -1) {
          options.push(recentAccessItem?.type);
        }
      });
    return options.map((option: string) => ({ label: option, value: option }));
  }, [detailedSavedObjects]);

  const capitalTheFirstLetter = function (str: string) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  };

  const itemsForDisplay = useMemo(() => {
    return [...detailedSavedObjects].filter((item) => {
      if (item.error) return false;
      if (selectedType === allOption) return true;
      return item.type === selectedType;
    });
  }, [detailedSavedObjects, selectedType]);

  const constructInAppUrl = useCallback(
    (object: SavedObjectWithMetadata) => {
      const { path = '' } = object.meta.inAppUrl || {};
      let finalPath = path;
      // index pattern has been move out of dashboard management to be a standalone application,
      // the path changed from `/app/management/opensearch-dashboards/indexPatterns` to `/app/indexPatterns`
      if (useUpdatedUX && finalPath) {
        finalPath = finalPath.replace(/^\/app\/management\/opensearch-dashboards/, '/app');
      }
      const basePath = core.http.basePath;
      let inAppUrl = basePath.prepend(finalPath);
      if (object.workspaces?.length) {
        if (currentWorkspace) {
          inAppUrl = formatUrlWithWorkspaceId(finalPath, currentWorkspace.id, basePath);
        } else {
          const workspace = workspaceList.find((item) => object.workspaces?.includes(item.id));
          if (workspace) {
            inAppUrl = formatUrlWithWorkspaceId(finalPath, workspace.id, basePath);
          }
        }
      }
      return inAppUrl;
    },
    [core.http.basePath, currentWorkspace, useUpdatedUX, workspaceList]
  );

  const getRecentlyUpdated = useCallback(async () => {
    try {
      const allowedTypes = [
        'dashboard',
        'visualization',
        'search',
        'query',
        'index-pattern',
        'visualization-visbuilder',
      ];
      const findOptions: SavedObjectsFindOptions = {
        type: allowedTypes,
        sortField: 'updated_at',
        sortOrder: 'desc',
        workspaces: currentWorkspace ? [currentWorkspace.id] : undefined,
        page: 1,
      };
      const res = await findObjects(core.http, findOptions);
      const savedObjects = res.savedObjects
        .map((obj) => {
          const findWorkspace = workspaceList.find((workspace) =>
            obj.workspaces?.includes(workspace.id)
          );

          return {
            ...obj,
            updatedAt: moment(obj?.updated_at).valueOf(),
            lastAccessedTime: moment(obj?.updated_at).valueOf(),
            workspaceName: findWorkspace?.name,
            label: obj.meta.title,
            link: constructInAppUrl(obj),
          };
        })
        .sort(sortBy(sortKeyMap[recentlyUpdated]));
      setDetailedSavedObjects(savedObjects);
    } finally {
      setIsLoading(false);
    }
  }, [constructInAppUrl, core.http, currentWorkspace, workspaceList]);

  const getRecentAccessed = useCallback(() => {
    setIsLoading(true);
    try {
      const savedObjects = recentAccessed
        .filter(
          (item) =>
            item.meta?.type &&
            (!currentWorkspace || (currentWorkspace && item.workspaceId === currentWorkspace.id))
        )
        .map((item) => ({
          type: item.meta?.type || '',
          id: item.id,
        }));

      if (savedObjects.length) {
        bulkGetDetail(savedObjects, core.http).then((res) => {
          const formatDetailedSavedObjects = res
            .map((obj) => {
              const recentAccessItem = recentAccessed.find(
                (item) => item.id === obj.id
              ) as ChromeRecentlyAccessedHistoryItem;

              const findWorkspace = workspaceList.find(
                (workspace) => workspace.id === recentAccessItem.workspaceId
              );

              const { link, label, workspaceId } = recentAccessItem;
              const basePath = core.http.basePath;

              const href = formatUrlWithWorkspaceId(link, workspaceId || '', basePath);

              return {
                ...recentAccessItem,
                ...obj,
                ...recentAccessItem.meta,
                workspaceName: findWorkspace?.name,
                updatedAt: moment(obj?.updated_at).valueOf(),
                link: workspaceEnabled ? href : link,
                label: label || obj.meta.title,
              };
            })
            .sort(sortBy(sortKeyMap[recentlyViewed]));
          setDetailedSavedObjects(formatDetailedSavedObjects);
        });
      } else {
        setDetailedSavedObjects([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [core.http, currentWorkspace, recentAccessed, workspaceList, workspaceEnabled]);

  useEffect(() => {
    // reset to allOption
    setSelectedType(allOption);
    if (selectedSort === recentlyUpdated) {
      getRecentlyUpdated();
    } else {
      getRecentAccessed();
    }
  }, [getRecentlyUpdated, getRecentAccessed, selectedSort]);

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiFlexGroup justifyContent="flexStart" alignItems="center" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <EuiTitle size="s">
                <h2>
                  {i18n.translate('savedObjectsManagement.recentWorkSection.title', {
                    defaultMessage: 'Assets',
                  })}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                display="inlineBlock"
                position="right"
                content={i18n.translate('savedObjectsManagement.recentWorkSection.assetsInfo', {
                  defaultMessage:
                    'Dashboards, visualizations, saved queries, and other assets within your Workspaces.',
                })}
                data-test-subj="assetsTooltip"
              >
                <EuiIcon type="iInCircle" />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFilterGroup>
                {[recentlyViewed, recentlyUpdated].map((item) => (
                  <EuiFilterButton
                    hasActiveFilters={selectedSort === item}
                    key={item}
                    onClick={() => setSelectedSort(item)}
                    data-test-subj={`filterButton-${encodeURIComponent(item)}`}
                  >
                    {item}
                  </EuiFilterButton>
                ))}
              </EuiFilterGroup>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiComboBox
                style={{
                  width: widthForTypeSelector,
                }}
                isClearable={false}
                options={allOptions}
                singleSelection={{ asPlainText: true }}
                onChange={(options) => setSelectedType(options[0].value || '')}
                selectedOptions={[{ label: selectedType, value: selectedType }]}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {itemsForDisplay.length ? (
        <EuiFlexGroup>
          {Array.from({ length: MAX_ITEMS_DISPLAY }).map((item, itemIndexInRow) => {
            const recentAccessItem = itemsForDisplay[itemIndexInRow];
            let content = null;
            if (recentAccessItem) {
              content = (
                <EuiCard
                  title={
                    <EuiFlexGroup justifyContent="flexStart" alignItems="center" gutterSize="none">
                      <EuiFlexItem grow={false}>
                        <EuiIcon
                          style={{ marginRight: widthForRightMargin }}
                          type={recentAccessItem.meta.icon || 'apps'}
                          color="subdued"
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          {capitalTheFirstLetter(recentAccessItem.type)}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                  data-test-subj="recentlyCard"
                  description={<h3 className="eui-textBreakAll">{recentAccessItem.label}</h3>}
                  textAlign="left"
                  href={recentAccessItem.link}
                  footer={
                    <EuiFlexGroup
                      justifyContent="spaceBetween"
                      direction="column"
                      gutterSize="none"
                    >
                      <EuiFlexItem>
                        <EuiFlexGrid columns={2} gutterSize="s">
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" color="default">
                              {selectedSort === recentlyViewed
                                ? i18n.translate(
                                    'savedObjectsManagement.recentWorkSection.viewedAt',
                                    {
                                      defaultMessage: 'Viewed',
                                    }
                                  )
                                : i18n.translate(
                                    'savedObjectsManagement.recentWorkSection.updatedAt',
                                    {
                                      defaultMessage: 'Updated',
                                    }
                                  )}
                              :{' '}
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={1} className="eui-textRight">
                            <EuiText size="xs" color="default">
                              <b>
                                {selectedSort === recentlyViewed
                                  ? moment(recentAccessItem?.lastAccessedTime).fromNow()
                                  : moment(recentAccessItem?.updatedAt).fromNow()}
                              </b>
                            </EuiText>
                          </EuiFlexItem>
                        </EuiFlexGrid>
                      </EuiFlexItem>
                      {workspaceEnabled && !currentWorkspace && (
                        <EuiFlexItem>
                          <EuiFlexGrid columns={2} gutterSize="s">
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="default">
                                {i18n.translate(
                                  'savedObjectsManagement.recentWorkSection.workspace',
                                  {
                                    defaultMessage: 'Workspace',
                                  }
                                )}
                                :
                              </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={1} className="eui-textRight">
                              <EuiText size="xs" color="default">
                                <b>{recentAccessItem.workspaceName || 'N/A'} </b>
                              </EuiText>
                            </EuiFlexItem>
                          </EuiFlexGrid>
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  }
                />
              );
            }
            return (
              <EuiFlexItem key={recentAccessItem?.id || itemIndexInRow}>{content}</EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      ) : isLoading ? (
        <EuiEmptyPrompt
          icon={<EuiLoadingLogo logo="savedObjectsApp" size="xl" />}
          title={<h3>Loading Assets</h3>}
        />
      ) : (
        <EuiEmptyPrompt
          title={
            <h3>
              {i18n.translate('savedObjectsManagement.recentWorkSection.empty.title', {
                defaultMessage: 'No assets to display',
              })}
            </h3>
          }
          body={
            <EuiFlexGroup
              gutterSize="s"
              justifyContent="spaceBetween"
              alignItems="center"
              direction="column"
            >
              <EuiFlexItem>
                <EuiText color="subdued" size="s">
                  {i18n.translate('savedObjectsManagement.recentWorkSection.empty.body', {
                    defaultMessage: 'The recent assets will appear here.',
                  })}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSmallButton
                  iconType="popout"
                  iconSide="right"
                  iconGap="none"
                  target="_blank"
                  href={core.application.getUrlForApp(APP_ID)}
                >
                  {i18n.translate('savedObjectsManagement.recentWorkSection.empty.manageAssets', {
                    defaultMessage: 'Manage assets',
                  })}
                </EuiSmallButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        />
      )}
      <EuiSpacer size="m" />
      <EuiLink target="_blank" onClick={() => core.application.navigateToApp(APP_ID)}>
        <EuiText size="s" className="eui-displayInline">
          {i18n.translate('savedObjectsManagement.recentWorkSection.view_all', {
            defaultMessage: 'View all',
          })}
        </EuiText>
      </EuiLink>
    </EuiPanel>
  );
};
