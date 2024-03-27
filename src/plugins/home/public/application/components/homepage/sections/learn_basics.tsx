/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiCard,
  EuiTitle,
  EuiButtonIcon,
  EuiLink,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

import '../_homepage.scss';

const render = renderFn(() => {
  const [isExpanded, setExpanded] = useState(true);
  const toggleExpanded = () => setExpanded((expanded) => !expanded);
  const services = getServices();
  const navigateToUrl = services.application.navigateToUrl;

  const content = (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCard
            layout="horizontal"
            icon={<EuiIcon size="xl" type="document" />}
            title={
              <p>
                Quickstart guide
                <EuiIcon size="l" type="popout" className="learn-basics-title-icon" />
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

  return (
    <>
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow>
          <EuiTitle size="m">
            <h2>
              {i18n.translate('home.sections.learnBasics.title', {
                defaultMessage: 'Learn OpenSearch basics',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiLink
            href="https://opensearch.org/docs/latest/"
            target="_blank"
            className="learn-basics-links"
          >
            See all documentation
          </EuiLink>
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

export const learnBasicsSection: Section = {
  id: 'home:learnBasics',
  title: i18n.translate('home.sections.learnBasics.title', {
    defaultMessage: 'Learn OpenSearch basics',
  }),
  render,
};
