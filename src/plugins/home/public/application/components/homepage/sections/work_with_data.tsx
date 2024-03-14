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
  OuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const Card: FC<{
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
  footerButtonProps?: EuiButtonProps;
  footerUrl: string;
  footerText: string;
  footerExternal?: boolean;
}> = ({
  imgSrc,
  imgAlt,
  title,
  description,
  footerButtonProps,
  footerUrl,
  footerText,
  footerExternal,
}) => {
  const { addBasePath } = getServices();

  return (
    <EuiFlexItem grow={1}>
      <EuiCard
        image={<EuiImage src={addBasePath(imgSrc)} alt={imgAlt} />}
        title={title}
        description={description}
        footer={
          <EuiButton
            size="s"
            fullWidth
            href={footerUrl}
            target={footerExternal ? '_blank' : undefined}
            {...footerButtonProps}
          >
            {footerText}
          </EuiButton>
        }
        textAlign="left"
      />
    </EuiFlexItem>
  );
};

const render = renderFn(() => {
  const services = getServices();
  const navigateToApp = services.application.navigateToApp;
  const darkMode = services.injectedMetadata.getBranding().darkMode;

  return (
    <EuiFlexGroup wrap direction="row" alignItems="stretch">
      <OuiFlexItem>
        <EuiCard
          title={i18n.translate('home.sections.workWithData.sampleData.title', {
            defaultMessage: 'Start with a sample data set',
          })}
          description={i18n.translate('home.sections.workWithData.sampleData.description', {
            defaultMessage: 'with Sample Data Sets',
          })}
          onClick={() => navigateToApp('home', { path: '#/tutorial_directory' })}
          image={`/plugins/home/assets/sample_data_resources/ecommerce/${
            darkMode ? 'dashboard_dark_new.png' : 'dashboard_new.png'
          }`}
        />
      </OuiFlexItem>

      <Card
        imgSrc="/plugins/home/assets/ingestion.png"
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
        footerExternal
      />
      <Card
        imgSrc={`/plugins/home/assets/${darkMode ? 'discover_dark.png' : 'discover_light.png'}`}
        imgAlt={i18n.translate('home.sections.workWithData.explore.alt', {
          defaultMessage: 'Explore image',
        })}
        title={i18n.translate('home.sections.workWithData.explore.title', {
          defaultMessage: 'Explore data',
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
        footerExternal
      />
    </EuiFlexGroup>
  );
});

export const workWithDataSection: Section = {
  id: 'home:workWithData',
  title: i18n.translate('home.sections.workWithData.title', {
    defaultMessage: 'Start working with data',
  }),
  description: i18n.translate('home.sections.workWithData.description', {
    defaultMessage:
      'Get started by ingesting data to access robust and visual data exploration capabilities. Not ready to ingest data yet? Use our sample data to explore and get familiar with OpenSearch capabilities.',
  }),
  render,
};
