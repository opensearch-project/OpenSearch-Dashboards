/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiTitle, EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';
import { RecentWorkFilter } from './recent_work_filter';

const render = renderFn(() => {
  const [isExpanded, setExpanded] = useState(true);
  const toggleExpanded = () => setExpanded((expanded) => !expanded);
  const services = getServices();
  const recentAccessed = useObservable(services.chrome.recentlyAccessed.get$(), []);
  const navigateToUrl = services.application.navigateToUrl;
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);

  const savedObjectTypes = recentAccessed
    .map((item) => item.type)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  const filteredRecentAccessed = recentAccessed.filter(
    (item) => filteredTypes.length === 0 || (item.type && filteredTypes.includes(item.type))
  );

  const content = !recentAccessed.length ? (
    <div>
      <h2>No recent work</h2>
      <p>Recent work will appear here.</p>
    </div>
  ) : (
    <div>
      <EuiFlexGroup>
        {filteredRecentAccessed
          .slice(0, 4)
          .map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
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
      <EuiFlexGroup>
        {filteredRecentAccessed
          .slice(4, 8)
          .map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
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

  return (
    <>
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow>
          <EuiTitle size="m">
            <h2>
              {i18n.translate('home.sections.recentWork.title', {
                defaultMessage: 'Recent work',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RecentWorkFilter
            filteredTypes={filteredTypes}
            setFilteredTypes={setFilteredTypes}
            savedObjectTypes={savedObjectTypes}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            onClick={toggleExpanded}
            size="s"
            iconSize="m"
            color="text"
            aria-label={
              isExpanded
                ? i18n.translate('home.section.collapse', { defaultMessage: 'Collapse section' })
                : i18n.translate('home.section.expand', { defaultMessage: 'Expand section' })
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {isExpanded && content}
    </>
  );
});

export const recentWorkSection: Section = {
  id: 'home:recentWork',
  title: i18n.translate('home.sections.recentWork.title', {
    defaultMessage: 'Recent work',
  }),
  render,
};
