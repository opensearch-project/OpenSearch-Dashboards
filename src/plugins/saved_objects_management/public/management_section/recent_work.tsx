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
  EuiSpacer,
  EuiFlexGroup,
  EuiTitle,
  EuiFilterGroup,
  EuiFilterButton,
  EuiComboBox,
  EuiIcon,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ChromeRecentlyAccessedHistoryItem,
  CoreStart,
  SavedObject,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { SavedObjectWithMetadata } from 'src/plugins/saved_objects_management/common';
import { createRecentNavLink } from '../../../../core/public';

const allOption = i18n.translate('savedObjectsManagement.recentWorkSection.all.items', {
  defaultMessage: 'all items',
});

const recentlyViewed = i18n.translate('savedObjectsManagement.recentWorkSection.recentlyViewed', {
  defaultMessage: 'recently viewed',
});

const recentlyUpdated = i18n.translate('savedObjectsManagement.recentWorkSection.recentlyUpdated', {
  defaultMessage: 'recently updated',
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
      .forEach((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
        if (recentAccessItem.meta?.type && options.indexOf(recentAccessItem.meta.type) === -1) {
          options.push(recentAccessItem.meta.type);
        }
      });
    return options.map((option: string) => ({ label: option, value: option }));
  }, [detailedSavedObjects]);

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
          <EuiTitle>
            <h5>
              {i18n.translate('savedObjectsManagement.recentWorkSection.title', {
                defaultMessage: 'Assets',
              })}
            </h5>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFilterGroup>
                {[recentlyViewed, recentlyUpdated].map((item) => (
                  <EuiFilterButton
                    key={item}
                    hasActiveFilters={item === selectedSort}
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
                  title={recentAccessItem.label}
                  titleSize="xs"
                  data-test-subj="recentlyCard"
                  description=""
                  textAlign="left"
                  href={recentNavLink.href}
                  footer={
                    <>
                      <div>
                        <EuiIcon
                          style={{ marginRight: widthForRightMargin }}
                          type={recentAccessItem.meta.icon || 'apps'}
                        />
                        {recentAccessItem.type}
                      </div>
                      <EuiSpacer size="s" />
                      <div>
                        {selectedSort === recentlyViewed
                          ? i18n.translate('savedObjectsManagement.recentWorkSection.viewedAt', {
                              defaultMessage: 'Viewed',
                            })
                          : i18n.translate('savedObjectsManagement.recentWorkSection.updatedAt', {
                              defaultMessage: 'Updated',
                            })}
                        :{' '}
                        <b>
                          {selectedSort === recentlyViewed
                            ? moment(recentAccessItem?.lastAccessedTime).fromNow()
                            : moment(recentAccessItem?.updatedAt).fromNow()}
                        </b>
                      </div>
                      {workspaceEnabled && (
                        <div>
                          {i18n.translate('savedObjectsManagement.recentWorkSection.workspace', {
                            defaultMessage: 'Workspace',
                          })}
                          : <b>{recentAccessItem.workspaceName || 'N/A'}</b>
                        </div>
                      )}
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
          title={
            <h2>
              {i18n.translate('savedObjectsManagement.recentWorkSection.empty.title', {
                defaultMessage: 'No recent work',
              })}
            </h2>
          }
        />
      )}
    </EuiPanel>
  );
};
