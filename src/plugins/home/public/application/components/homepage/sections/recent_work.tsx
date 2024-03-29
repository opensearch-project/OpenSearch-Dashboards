/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiImage } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';
import { RecentWorkFilter } from './recent_work_filter';

import '../_homepage.scss';

const render = renderFn((opts) => {
  const services = getServices();
  const navigateToUrl = services.application.navigateToUrl;
  const recentAccessed = useObservable(services.chrome.recentlyAccessed.get$(), []);

  if (!recentAccessed.length) {
    return (
      <div className="empty-recent-work">
        <h2>No recent work</h2>
        <p>Recent work will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <EuiFlexGroup>
        {recentAccessed.slice(0, 4).map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
          return (
            <EuiFlexItem>
              <EuiCard
                layout="horizontal"
                title={recentAccessItem.label}
                titleSize="xs"
                description={recentAccessItem.type || ' ' + recentAccessItem.updatedAt}
                onClick={() => navigateToUrl(services.addBasePath(recentAccessItem.link))}
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
      <EuiFlexGroup>
        {recentAccessed.slice(4, 8).map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
          return (
            <EuiFlexItem>
              <EuiCard
                layout="horizontal"
                title={recentAccessItem.label}
                titleSize="xs"
                description={recentAccessItem.type || ' '}
                onClick={() => navigateToUrl(services.addBasePath(recentAccessItem.link))}
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </div>
  );
});

const HeaderFilter = () => {
  const services = getServices();
  const recentAccessed = useObservable(services.chrome.recentlyAccessed.get$(), []);
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const savedObjectTypes = recentAccessed
    .map((item) => item.type)
    .filter((item, index, arr) => arr.indexOf(item) === index);
  return (
    <RecentWorkFilter
      filteredTypes={filteredTypes}
      setFilteredTypes={setFilteredTypes}
      savedObjectTypes={savedObjectTypes}
    />
  );
};

export const recentWorkSection: Section = {
  id: 'home:recentWork',
  title: i18n.translate('home.sections.recentWork.title', {
    defaultMessage: 'Recent work',
  }),
  render,
  opts: 4,
};
