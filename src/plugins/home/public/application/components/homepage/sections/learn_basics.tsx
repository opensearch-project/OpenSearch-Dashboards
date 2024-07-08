/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiCard, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

import '../_homepage.scss';

const render = renderFn(() => {
  const services = getServices();
  const navigateToUrl = services.application.navigateToUrl;

  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem grow={1}>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={
              <p>
                Quickstart guide
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
            titleSize="xs"
            description={i18n.translate('home.sections.learnBasics.quickstart.description', {
              defaultMessage: 'Get started in minutes with OpenSearch Dashboards.',
            })}
            onClick={() =>
              navigateToUrl('https://opensearch.org/docs/latest/dashboards/quickstart/')
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={
              <p>
                Building data visualizations
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
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
            title={
              <p>
                Creating dashboards
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
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
            title={
              <p>
                Get familiar with Discover
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
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
            title={
              <p>
                Running queries in Dev Tools console
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
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
            title={
              <p>
                Working with indexes
                <EuiIcon size="m" type="popout" className="popover-title-icon" />
              </p>
            }
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
  render,
  headerComponent: (
    <EuiLink
      href="https://opensearch.org/docs/latest/"
      target="_blank"
      className="learn-basics-links"
    >
      See all documentation
    </EuiLink>
  ),
};
