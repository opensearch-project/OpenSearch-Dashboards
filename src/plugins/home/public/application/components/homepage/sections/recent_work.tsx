/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import moment from 'moment';
import {
  EuiFlexItem,
  EuiCard,
  EuiFlexGrid,
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiTitle,
  EuiFilterGroup,
  EuiFilterButton,
  EuiComboBox,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ChromeRecentlyAccessedHistoryItem,
  CoreStart,
  SavedObject,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';

const allOption = i18n.translate('homepage.recentWorkSection.all.items', {
  defaultMessage: 'all items',
});

const recentlyViewed = i18n.translate('homepage.recentWorkSection.recentlyViewed', {
  defaultMessage: 'recently viewed',
});

const recentlyUpdated = i18n.translate('homepage.recentWorkSection.recentlyUpdated', {
  defaultMessage: 'recently updated',
});

const sortKeyMap = {
  [recentlyViewed]: 'viewedAt',
  [recentlyUpdated]: 'updatedAt',
} as const;

type KeyOf<T> = keyof T;

function sortBy<T>(key: KeyOf<T>) {
  return (a: T, b: T): number => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0);
}

type DetailedRecentlyAccessedItem = SavedObject &
  ChromeRecentlyAccessedHistoryItem &
  ChromeRecentlyAccessedHistoryItem['extraProps'] & {
    updatedAt: number;
  };

export const RecentWork = (props: { core: CoreStart }) => {
  const { core } = props;
  const navigateToUrl = core.application.navigateToUrl;
  const recently$Ref = useRef(core.chrome.recentlyAccessed.get$());
  const recentAccessed = useObservable(recently$Ref.current, []);

  const allOptions = useMemo(() => {
    const options: string[] = [allOption];
    recentAccessed.forEach((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
      if (
        recentAccessItem.extraProps?.type &&
        options.indexOf(recentAccessItem.extraProps.type) === -1
      ) {
        options.push(recentAccessItem.extraProps.type);
      }
    });
    return options.map((option: string) => ({ label: option, value: option }));
  }, [recentAccessed]);

  const [selectedType, setSelectedType] = useState(allOption);
  const [selectedSort, setSelectedSort] = useState(recentlyViewed);
  const [detailedSavedObjects, setDetailedSavedObjects] = useState<DetailedRecentlyAccessedItem[]>(
    []
  );

  const itemsForDisplay = useMemo(() => {
    const sortedResult = [...detailedSavedObjects].sort(sortBy(sortKeyMap[selectedSort]));
    return sortedResult
      .reverse()
      .filter((item: SavedObject & ChromeRecentlyAccessedHistoryItem) => {
        if (selectedType === allOption) return true;
        return item.extraProps?.type === selectedType;
      });
  }, [detailedSavedObjects, selectedSort, selectedType]);

  useEffect(() => {
    const savedObjects = recentAccessed
      .filter((item) => item.extraProps?.type)
      .map((item) => ({
        type: item.extraProps?.type || '',
        id: item.id,
      }));

    core.savedObjects.client.bulkGet(savedObjects).then((res) => {
      const formatDetailedSavedObjects = res.savedObjects.map((obj) => {
        const recentAccessItem = recentAccessed.find(
          (item) => item.id === obj.id
        ) as ChromeRecentlyAccessedHistoryItem;
        return {
          ...recentAccessItem,
          ...obj,
          ...recentAccessItem.extraProps,
          updatedAt: moment(obj?.updated_at).valueOf(),
        };
      });
      setDetailedSavedObjects(formatDetailedSavedObjects);
    });
  }, [recentAccessed, core.savedObjects.client]);

  if (!recentAccessed.length) {
    return (
      <EuiPanel>
        <h2>
          {i18n.translate('homepage.recentWorkSection.empty.title', {
            defaultMessage: 'No recent work',
          })}
        </h2>
      </EuiPanel>
    );
  }

  return (
    <>
      <EuiSpacer />
      <EuiPanel>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem>
            <EuiTitle>
              <h5>
                {i18n.translate('homepage.recentWorkSection.title', {
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
                    >
                      {item}
                    </EuiFilterButton>
                  ))}
                </EuiFilterGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiComboBox
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
        <EuiFlexGroup>
          {Array.from({ length: 6 }).map((item, itemIndexInRow) => {
            const recentAccessItem = itemsForDisplay[itemIndexInRow];
            const content = recentAccessItem ? (
              <EuiCard
                layout="horizontal"
                title={recentAccessItem.label}
                titleSize="xs"
                description={
                  <>
                    {selectedSort === recentlyViewed
                      ? i18n.translate('homepage.recentWorkSection.viewedAt', {
                          defaultMessage: 'Last viewed {viewedAt}',
                          values: {
                            viewedAt: moment(recentAccessItem?.viewedAt).fromNow(),
                          },
                        })
                      : i18n.translate('homepage.recentWorkSection.updatedAt', {
                          defaultMessage: 'Last updated {updatedAt}',
                          values: {
                            updatedAt: moment(recentAccessItem?.updatedAt).fromNow(),
                          },
                        })}
                  </>
                }
                onClick={() => navigateToUrl(core.http.basePath.prepend(recentAccessItem.link))}
              />
            ) : null;
            return (
              <EuiFlexItem key={recentAccessItem?.id || itemIndexInRow}>{content}</EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
};
