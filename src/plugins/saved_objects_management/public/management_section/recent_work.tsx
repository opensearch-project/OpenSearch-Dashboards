/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ChromeRecentlyAccessedHistoryItem,
  CoreStart,
  SavedObject,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { SavedObjectWithMetadata } from 'src/plugins/saved_objects_management/common';
import { APP_ID } from '../plugin';
import { createRecentNavLink } from '../../../../core/public';

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

type DetailedRecentlyAccessedItem = ChromeRecentlyAccessedHistoryItem &
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

const widthForTypeSelector = 220;
const widthForRightMargin = 4;
const MAX_ITEMS_DISPLAY = 6;

export const RecentWork = (props: { core: CoreStart; workspaceEnabled?: boolean }) => {
  const { core, workspaceEnabled } = props;
  const recently$Ref = useRef(core.chrome.recentlyAccessed.get$());
  const recentAccessed = useObservable(recently$Ref.current, []);
  const workspaceList = useObservable(core.workspaces.workspaceList$, []);
  const [selectedType, setSelectedType] = useState(allOption);
  const [selectedSort, setSelectedSort] = useState(recentlyViewed);
  const [detailedSavedObjects, setDetailedSavedObjects] = useState<DetailedRecentlyAccessedItem[]>(
    []
  );

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

  const capitalTheFirstLetter = function (recentAccessItem: DetailedRecentlyAccessedItem) {
    return recentAccessItem.type.charAt(0).toUpperCase() + recentAccessItem.type.slice(1);
  };

  const itemsForDisplay = useMemo(() => {
    const sortedResult = [...detailedSavedObjects]
      .filter((item) => !item.error)
      .sort(sortBy(sortKeyMap[selectedSort]));
    return sortedResult.filter((item: SavedObject & ChromeRecentlyAccessedHistoryItem) => {
      if (selectedType === allOption) return true;
      return item.type === selectedType;
    });
  }, [detailedSavedObjects, selectedSort, selectedType]);

  useEffect(() => {
    const savedObjects = recentAccessed
      .filter((item) => item.meta?.type)
      .map((item) => ({
        type: item.meta?.type || '',
        id: item.id,
      }));

    if (savedObjects.length) {
      bulkGetDetail(savedObjects, core.http).then((res) => {
        const formatDetailedSavedObjects = res.map((obj) => {
          const recentAccessItem = recentAccessed.find(
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
          };
        });
        setDetailedSavedObjects(formatDetailedSavedObjects);
      });
    }
  }, [core.savedObjects.client, recentAccessed, core.http, workspaceList]);

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
                    'Dashboards, visualizations, saved queries, and other assets within your Worksapces.',
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
              const navLinks = core.chrome.navLinks.getAll();
              const recentNavLink = createRecentNavLink(
                recentAccessItem,
                navLinks,
                core.http.basePath,
                core.application.navigateToUrl
              );

              content = (
                <EuiCard
                  title={
                    <EuiFlexGroup justifyContent="flexStart" alignItems="center" gutterSize="none">
                      <EuiFlexItem grow={false}>
                        <EuiIcon
                          style={{ marginRight: widthForRightMargin }}
                          type={recentAccessItem.meta.icon || 'apps'}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          {capitalTheFirstLetter(recentAccessItem)}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                  data-test-subj="recentlyCard"
                  description={<h3>{recentAccessItem.label}</h3>}
                  textAlign="left"
                  href={recentNavLink.href}
                  footer={
                    <>
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
                        <EuiFlexItem grow={1} style={{ textAlign: 'right' }}>
                          <EuiText size="xs" color="default">
                            <b>
                              {selectedSort === recentlyViewed
                                ? moment(recentAccessItem?.lastAccessedTime).fromNow()
                                : moment(recentAccessItem?.updatedAt).fromNow()}
                            </b>
                          </EuiText>
                        </EuiFlexItem>

                        {workspaceEnabled && (
                          <>
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
                            <EuiFlexItem grow={1} style={{ textAlign: 'right' }}>
                              <EuiText size="xs" color="default">
                                <b>{recentAccessItem.workspaceName || 'N/A'} </b>
                              </EuiText>
                            </EuiFlexItem>
                          </>
                        )}
                      </EuiFlexGrid>
                    </>
                  }
                  onClick={recentNavLink.onClick}
                />
              );
            }
            return (
              <EuiFlexItem key={recentAccessItem?.id || itemIndexInRow}>{content}</EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      ) : (
        <EuiEmptyPrompt
          icon={<EuiIcon size="l" type="layers" />}
          title={
            <h2>
              {i18n.translate('savedObjectsManagement.recentWorkSection.empty.title', {
                defaultMessage: 'No assets found',
              })}
            </h2>
          }
          body={i18n.translate('savedObjectsManagement.recentWorkSection.empty.body', {
            defaultMessage: "Assets you've recently viewed or updated will appear here.",
          })}
        />
      )}
      <EuiSpacer size="m" />
      <EuiLink target="_blank" onClick={() => core.application.navigateToApp(APP_ID)}>
        <EuiText size="s" className="eui-displayInline">
          {i18n.translate('home.list.card.view_all', {
            defaultMessage: 'View all',
          })}
        </EuiText>
      </EuiLink>
    </EuiPanel>
  );
};
