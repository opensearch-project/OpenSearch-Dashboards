/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiTitle,
  EuiSpacer,
  EuiListGroup,
  EuiListGroupItemProps,
  IconType,
  EuiCard,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const render = renderFn(() => {
  const services = getServices();
  const navigateToUrl = services.application.navigateToUrl;

  return (
    <EuiFlexGroup>
      <EuiFlexGroup>
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.quickstart.title', {
            defaultMessage: 'Quickstart guide',
          })}
          description={i18n.translate('home.sections.learnBasics.quickstart.description', {
            defaultMessage:
              'The quickstart guide provides tutorials on using OpenSearch Dashboards applications and tools. Use these...',
          })}
          onClick={() => navigateToUrl('https://opensearch.org/docs/latest/dashboards/quickstart/')}
        />
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.visualization.title', {
            defaultMessage: 'Building data visualizations',
          })}
          description={i18n.translate('home.sections.learnBasics.visualization.description', {
            defaultMessage:
              'By visualizing your data, you translate complex, high-volume, or numerical data into a visual representation...',
          })}
          onClick={() =>
            navigateToUrl('https://opensearch.org/docs/latest/dashboards/visualize/viz-index/')
          }
        />
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.dashboard.title', {
            defaultMessage: 'Creating dashboards',
          })}
          description={i18n.translate('home.sections.learnBasics.dashboard.description', {
            defaultMessage:
              'The Dashboard application lets you visually represent your analytical, operational, and strategic data to help...',
          })}
          onClick={() =>
            navigateToUrl('https://opensearch.org/docs/latest/dashboards/dashboard/index/')
          }
        />
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.discover.title', {
            defaultMessage: 'Get familiar with Discover',
          })}
          description={i18n.translate('home.sections.learnBasics.discover.description', {
            defaultMessage:
              'To analyze your data in OpenSearch and visualize key metrics, you can use the Discover application in...',
          })}
          onClick={() =>
            navigateToUrl('https://opensearch.org/docs/latest/dashboards/discover/index-discover/')
          }
        />
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.devtool.title', {
            defaultMessage: 'Running queries in Dev Tools console',
          })}
          description={i18n.translate('home.sections.learnBasics.devtool.description', {
            defaultMessage:
              'OpenSearch provides a query domain-specific language(DSL) called Query DSL. It is a flexible language with a...',
          })}
          onClick={() =>
            navigateToUrl('https://opensearch.org/docs/latest/dashboards/dev-tools/run-queries/')
          }
        />
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type="document" />}
          title={i18n.translate('home.sections.learnBasics.index.title', {
            defaultMessage: 'Working with indexes',
          })}
          description={i18n.translate('home.sections.learnBasics.index.description', {
            defaultMessage:
              'In the Index Management section, you can perform the operations available in the index API. Policies are...',
          })}
          onClick={() =>
            navigateToUrl('https://opensearch.org/docs/latest/dashboards/im-dashboards/index/')
          }
        />
      </EuiFlexGroup>
    </EuiFlexGroup>
  );
});

export const learnBasicsSection: Section = {
  id: 'home:learnBasics',
  title: i18n.translate('home.sections.learnBasics.title', {
    defaultMessage: 'Learn OpenSearch basics',
  }),
  description: i18n.translate('home.sections.learnBasics.description', {
    defaultMessage: 'Core concepts to get you started with OpenSearch.',
  }),
  links: [
    {
      label: i18n.translate('home.sections.learnBasics.documentation', {
        defaultMessage: 'Documentation',
      }),
      url: 'https://opensearch.org/docs/latest/',
      props: {
        external: true,
        target: '_blank',
      },
    },
  ],
  render,
};
