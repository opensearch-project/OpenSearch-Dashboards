/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiImage, EuiButton } from '@elastic/eui';
import { Section } from './section';

export const DataSection: React.FC = () => {
  const categories = (
    <EuiFlexGroup direction="row" alignItems="stretch">
      <EuiFlexItem grow={1}>
        <EuiCard
          display="plain"
          image={<EuiImage src="https://placehold.co/600x250" alt="Placeholder" />}
          title={i18n.translate('home.data.sampleData.title', {
            defaultMessage: 'Sample data',
          })}
          description={i18n.translate('home.data.sampleData.description', {
            defaultMessage:
              'These sample data sets allow you to explore dashboards, visualizations and features without needing to ingest your own data.',
          })}
          footer={
            <EuiButton fullWidth={true}>
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
          image={<EuiImage src="https://placehold.co/600x250" alt="Placeholder" />}
          title={i18n.translate('home.data.explore.title', {
            defaultMessage: 'Explore Data',
          })}
          description={i18n.translate('home.data.explore.description', {
            defaultMessage:
              'Data Explorer makes it simple to query, filter, and visualize your data for intuitive and in-depth data analysis.',
          })}
          footer={
            <EuiButton fullWidth={true}>
              <FormattedMessage id="home.data.explore.button" defaultMessage="Open Discover" />
            </EuiButton>
          }
          textAlign="left"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiCard
          display="plain"
          image={<EuiImage src="https://placehold.co/600x250" alt="Placeholder" />}
          title={i18n.translate('home.data.ingest.title', {
            defaultMessage: 'Ingest data with Data Prepper',
          })}
          description={i18n.translate('home.data.ingest.description', {
            defaultMessage:
              'Filter, enrich, transform, normalize, and aggregate data for analytics and visualization.',
          })}
          footer={
            <EuiButton fullWidth={true}>
              <FormattedMessage
                id="home.data.ingest.button"
                defaultMessage="Data Prepper Documentation"
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
    />
  );
};
