/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiImage } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const render = renderFn(() => {
  const services = getServices();
  const recentAccessed = useObservable(services.chrome.recentlyAccessed.get$(), []);
  const navigateToApp = services.application.navigateToApp;
  const navigateToUrl = services.application.navigateToUrl;
  const darkMode = services.injectedMetadata.getBranding().darkMode;

  if (!recentAccessed.length) {
    return (
      <div>
        <h2>No recent work</h2>
        <p>Recent work will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      {recentAccessed.map((recentAccessItem: ChromeRecentlyAccessedHistoryItem) => {
        return <p>{recentAccessItem.label}</p>;
      })}
    </div>
  );

  //   return (
  //     <EuiFlexGroup wrap direction="row" alignItems="stretch">
  //       <EuiFlexItem>
  //         <EuiCard
  //           title={i18n.translate('home.sections.workWithData.sampleData.title', {
  //             defaultMessage: 'Start with a sample data set',
  //           })}
  //           titleSize="xs"
  //           textAlign="left"
  //           description={i18n.translate('home.sections.workWithData.sampleData.description', {
  //             defaultMessage: 'with Sample Data Sets',
  //           })}
  //           onClick={() => navigateToApp('home', { path: '#/tutorial_directory' })}
  //           image={
  //             <EuiImage
  //               src={services.addBasePath(
  //                 `/plugins/home/assets/sample_data_resources/ecommerce/${
  //                   darkMode ? 'dashboard_dark_new.png' : 'dashboard_new.png'
  //                 }`
  //               )}
  //               alt="Sample data image"
  //             />
  //           }
  //         />
  //       </EuiFlexItem>
  //       <EuiFlexItem>
  //         <EuiCard
  //           title={i18n.translate('home.sections.workWithData.ingest.title', {
  //             defaultMessage: 'Prepare and ingest data',
  //           })}
  //           titleSize="xs"
  //           textAlign="left"
  //           description={i18n.translate('home.sections.workWithData.ingest.description', {
  //             defaultMessage: 'with Data Prepper',
  //           })}
  //           onClick={() => navigateToUrl('https://opensearch.org/docs/latest/data-prepper/')}
  //           image={
  //             <EuiImage
  //               src={services.addBasePath(`/plugins/home/assets/ingestion.png`)}
  //               alt="Injestion image"
  //             />
  //           }
  //         />
  //       </EuiFlexItem>
  //       <EuiFlexItem>
  //         <EuiCard
  //           title={i18n.translate('home.sections.workWithData.dashboards.title', {
  //             defaultMessage: 'Set up pre-built dashboards',
  //           })}
  //           titleSize="xs"
  //           textAlign="left"
  //           description={i18n.translate('home.sections.workWithData.integration.description', {
  //             defaultMessage: 'with integrations',
  //           })}
  //           onClick={() => navigateToApp('dashboards')}
  //         />
  //       </EuiFlexItem>
  //       <EuiFlexItem>
  //         <EuiCard
  //           title={i18n.translate('home.sections.workWithData.discover.title', {
  //             defaultMessage: 'Query and filter data for in-depth analysis',
  //           })}
  //           titleSize="xs"
  //           textAlign="left"
  //           description={i18n.translate('home.sections.workWithData.discover.description', {
  //             defaultMessage: 'with Discover',
  //           })}
  //           onClick={() => navigateToApp('discover')}
  //           image={
  //             <EuiImage
  //               src={services.addBasePath(
  //                 `/plugins/home/assets/${darkMode ? 'discover_dark.png' : 'discover_light.png'}`
  //               )}
  //               alt="Explore image"
  //             />
  //           }
  //         />
  //       </EuiFlexItem>
  //     </EuiFlexGroup>
  //   );
});

export const recentWorkSection: Section = {
  id: 'home:recentWork',
  title: i18n.translate('home.sections.recentWork.title', {
    defaultMessage: 'Recent work',
  }),
  render,
};
