/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiCard } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const render = renderFn(() => {
  const services = getServices();
  const navigateToUrl = services.application.navigateToUrl;

  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.quickstart.title', {
              defaultMessage: 'Quickstart guide',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.quickstart.description', {
              defaultMessage: 'Get started in minutes with OpenSearch Dashboards.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/quickstart/')
            }
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.visualization.title', {
              defaultMessage: 'Building data visualizations',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.visualization.description', {
              defaultMessage:
                'Design interactive charts and graphs to unlock insights from your data.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/visualize/viz-index/')
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup wrap direction="row" alignItems="stretch">
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.dashboard.title', {
              defaultMessage: 'Creating dashboards',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.dashboard.description', {
              defaultMessage: 'Build interactive dashboards to explore and analyze your data.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/dashboard/index/')
            }
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.discover.title', {
              defaultMessage: 'Get familiar with Discover',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.discover.description', {
              defaultMessage: 'Transform raw data into actionable insights.',
            })}
            onClick={() =>
              navigateToUrl(
                'https://opensearch.org/docs/latest/dashboards/discover/index-discover/'
              )
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup wrap direction="row" alignItems="stretch">
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.devtool.title', {
              defaultMessage: 'Running queries in Dev Tools console',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.devtool.description', {
              defaultMessage:
                'Execute queries and explore your code directly in OpenSearch Dashboards using Query DSL.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/dev-tools/run-queries/')
            }
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={i18n.translate('home.sections.learnBasics.index.title', {
              defaultMessage: 'Working with indexes',
            })}
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.index.description', {
              defaultMessage:
                'Effortlessly build and manage indexes for faster, more efficient data access.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/im-dashboards/index/')
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
});

export const learnBasicsSection: Section = {
  id: 'home:learnBasics',
  title: i18n.translate('home.sections.learnBasics.title', {
    defaultMessage: 'Learn OpenSearch basics',
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
