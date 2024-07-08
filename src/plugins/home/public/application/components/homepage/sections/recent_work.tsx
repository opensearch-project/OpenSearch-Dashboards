/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import moment from 'moment';
import { EuiFlexItem, EuiCard, EuiIcon, EuiFlexGrid } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

import '../_homepage.scss';

const itemType = [
  {
    type: 'dashboard',
    name: 'Dashboard',
    icon: 'dashboardApp',
  },
  {
    type: 'visualization',
    name: 'Visualization',
    icon: 'visualizeApp',
  },
  {
    type: 'search',
    name: 'Search',
    icon: 'discoverApp',
  },
  {
    type: 'visualization-visbuilder',
    name: 'Visualization(visbuilder)',
    icon: 'visualizeApp',
  },
];

const render = renderFn(() => {
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
      <EuiFlexGrid columns={4}>
        {recentAccessed.slice(0, 8).map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
          const recentWorkItem = itemType.filter((item) => item.type === recentAccessItem.type);
          if (recentWorkItem[0]) {
            return (
              <EuiFlexItem>
                <EuiCard
                  layout="horizontal"
                  title={i18n.translate('homepage.recentWorkSection.title', {
                    defaultMessage: recentAccessItem.label,
                  })}
                  titleSize="xs"
                  description={
                    <>
                      <EuiIcon
                        size="m"
                        className="recent-work-title-icon"
                        type={recentWorkItem[0].icon}
                      />
                      {i18n.translate('homepage.recentWorkSection.name', {
                        defaultMessage: recentWorkItem[0].name,
                      })}
                      <br />
                      {i18n.translate('homepage.recentWorkSection.updatedAt', {
                        defaultMessage:
                          'Last updated ' + moment(recentAccessItem?.updatedAt).fromNow(),
                      })}
                    </>
                  }
                  onClick={() => navigateToUrl(services.addBasePath(recentAccessItem.link))}
                />
              </EuiFlexItem>
            );
          }
        })}
      </EuiFlexGrid>
    </div>
  );
});

export const recentWorkSection: Section = {
  id: 'home:recentWork',
  title: i18n.translate('home.sections.recentWork.title', {
    defaultMessage: 'Recent work',
  }),
  render,
};
