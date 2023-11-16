/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiImage, EuiButton } from '@elastic/eui';
import { Section } from './section';
import { getServices } from '../../../opensearch_dashboards_services';
import ecommerceLight from '../../../../assets/sample_data_resources/ecommerce/dashboard_new.png';
import ecommerceDark from '../../../../assets/sample_data_resources/ecommerce/dashboard_dark_new.png';
import ingestion from '../../../../assets/ingestion.png';
import discoverLight from '../../../../assets/discover_light.png';
import discoverDark from '../../../../assets/discover_dark.png';

export const DataSection: React.FC<{ initiallyOpen?: boolean }> = ({ initiallyOpen }) => {
  const services = getServices();
  const getUrl = services.application.getUrlForApp;
  const darkMode = services.injectedMetadata.getBranding().darkMode;

  const categories = (
    <EuiFlexGroup wrap direction="row" alignItems="stretch">
      <EuiFlexItem grow={1}>
        <EuiCard
          display="plain"
          image={<EuiImage src={!darkMode ? ecommerceLight : ecommerceDark} alt="Placeholder" />}
          title={i18n.translate('home.data.sampleData.title', {
            defaultMessage: 'Start with Sample data',
          })}
          description={i18n.translate('home.data.sampleData.description', {
            defaultMessage:
              'These sample data sets allow you to explore dashboards, visualizations and features without needing to ingest your own data.',
          })}
          footer={
            <EuiButton
              size="s"
              fullWidth={true}
              href={getUrl('home', { path: '#/tutorial_directory' })}
            >
              <FormattedMessage
                id="home.data.sampleData.button"
                defaultMessage="Manage sample data"
              />
            </EuiButton>
          }
          textAlign="left"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiCard
          display="plain"
          image={<EuiImage src={ingestion} alt="Placeholder" />}
          title={i18n.translate('home.data.ingest.title', {
            defaultMessage: 'Ingest data',
          })}
          description={i18n.translate('home.data.ingest.description', {
            defaultMessage:
              'Filter, enrich, transform, normalize, and aggregate data for analytics and visualization.',
          })}
          footer={
            <EuiButton
              size="s"
              fullWidth={true}
              iconType="popout"
              iconSide="right"
              href="https://opensearch.org/docs/latest/data-prepper/index/"
            >
              <FormattedMessage
                id="home.data.ingest.button"
                defaultMessage="Ingestion Documentation"
              />
            </EuiButton>
          }
          textAlign="left"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiCard
          display="plain"
          image={<EuiImage src={!darkMode ? discoverLight : discoverDark} alt="Placeholder" />}
          title={i18n.translate('home.data.explore.title', {
            defaultMessage: 'Explore Data',
          })}
          description={i18n.translate('home.data.explore.description', {
            defaultMessage:
              'Discover makes it simple to query, filter, and visualize your data for intuitive and in-depth data analysis.',
          })}
          footer={
            <EuiButton
              size="s"
              fullWidth={true}
              iconType="popout"
              iconSide="right"
              href="https://opensearch.org/docs/latest/dashboards/discover/index-discover/"
            >
              <FormattedMessage
                id="home.data.explore.button"
                defaultMessage="Discover documentation"
              />
            </EuiButton>
          }
          textAlign="left"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <Section
      title={i18n.translate('home.data.title', { defaultMessage: 'Work with data' })}
      description={i18n.translate('home.data.description', {
        defaultMessage:
          'Get started by ingesting data to access rebust and visual data exploration capabilities. Not ready to ingest data yet? Use our sample data to explore and get familiar with OpenSearch capabilities.',
      })}
      categories={categories}
      initiallyOpen={initiallyOpen}
    />
  );
};
