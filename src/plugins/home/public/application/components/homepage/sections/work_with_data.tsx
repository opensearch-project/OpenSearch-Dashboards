/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCard,
  EuiImage,
  EuiButton,
  EuiButtonProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';
import ecommerceLight from '../../../../assets/sample_data_resources/ecommerce/dashboard_new.png';
import ecommerceDark from '../../../../assets/sample_data_resources/ecommerce/dashboard_dark_new.png';
import ingestion from '../../../../assets/ingestion.png';
import discoverLight from '../../../../assets/discover_light.png';
import discoverDark from '../../../../assets/discover_dark.png';

const Card: FC<{
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
  footerButtonProps?: EuiButtonProps;
  footerUrl: string;
  footerText: string;
}> = ({ imgSrc, imgAlt, title, description, footerButtonProps, footerUrl, footerText }) => (
  <EuiFlexItem grow={1}>
    <EuiCard
      image={<EuiImage src={imgSrc} alt={imgAlt} />}
      title={title}
      description={description}
      footer={
        <EuiButton size="s" fullWidth href={footerUrl} {...footerButtonProps}>
          {footerText}
        </EuiButton>
      }
      textAlign="left"
    />
  </EuiFlexItem>
);

const render = renderFn(() => {
  const services = getServices();
  const getUrl = services.application.getUrlForApp;
  const darkMode = services.injectedMetadata.getBranding().darkMode;

  return (
    <EuiFlexGroup wrap direction="row" alignItems="stretch">
      <Card
        imgSrc={darkMode ? ecommerceDark : ecommerceLight}
        imgAlt={i18n.translate('home.sections.workWithData.sampleData.alt', {
          defaultMessage: 'Sample data image',
        })}
        title={i18n.translate('home.sections.workWithData.sampleData.title', {
          defaultMessage: 'Start with Sample Data',
        })}
        description={i18n.translate('home.sections.workWithData.sampleData.description', {
          defaultMessage:
            'These sample data sets allow you to explore dashboards, visualizations and features without needing to ingest your own data.',
        })}
        footerUrl={getUrl('home', { path: '#/tutorial_directory' })}
        footerText={i18n.translate('home.sections.workWithData.sampleData.button', {
          defaultMessage: 'Manage sample data',
        })}
      />
      <Card
        imgSrc={ingestion}
        imgAlt={i18n.translate('home.sections.workWithData.ingest.alt', {
          defaultMessage: 'Ingestion image',
        })}
        title={i18n.translate('home.sections.workWithData.ingest.title', {
          defaultMessage: 'Ingest data',
        })}
        description={i18n.translate('home.sections.workWithData.ingest.description', {
          defaultMessage:
            'Filter, enrich, transform, normalize, and aggregate data for analytics and visualization.',
        })}
        footerButtonProps={{ iconType: 'popout', iconSide: 'right' }}
        footerUrl="https://opensearch.org/docs/latest/data-prepper/index/"
        footerText={i18n.translate('home.sections.workWithData.ingest.button', {
          defaultMessage: 'Ingestion Documentation',
        })}
      />
      <Card
        imgSrc={darkMode ? discoverDark : discoverLight}
        imgAlt={i18n.translate('home.sections.workWithData.explore.alt', {
          defaultMessage: 'Explore image',
        })}
        title={i18n.translate('home.sections.workWithData.explore.title', {
          defaultMessage: 'Explore Data',
        })}
        description={i18n.translate('home.sections.workWithData.explore.description', {
          defaultMessage:
            'Discover makes it simple to query, filter, and visualize your data for intuitive and in-depth data analysis.',
        })}
        footerButtonProps={{ iconType: 'popout', iconSide: 'right' }}
        footerUrl="https://opensearch.org/docs/latest/dashboards/discover/index-discover/"
        footerText={i18n.translate('home.sections.workWithData.explore.button', {
          defaultMessage: 'Discover documentation',
        })}
      />
    </EuiFlexGroup>
  );
});

export const workWithDataSection: Section = {
  id: 'home:workWithData',
  title: i18n.translate('home.sections.workWithData.title', {
    defaultMessage: 'Work with data',
  }),
  description: i18n.translate('home.sections.workWithData.description', {
    defaultMessage:
      'Get started by ingesting data to access robust and visual data exploration capabilities. Not ready to ingest data yet? Use our sample data to explore and get familiar with OpenSearch capabilities.',
  }),
  render,
};
