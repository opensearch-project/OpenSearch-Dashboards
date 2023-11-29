/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCard,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItemProps,
  IconType,
} from '@elastic/eui';
import { Section } from './section';
import { getServices } from '../../../opensearch_dashboards_services';

export const BasicsSection: React.FC<{ initiallyOpen?: boolean }> = ({ initiallyOpen }) => {
  const services = getServices();
  const logos = services.chrome.logos;

  const gettingStartedLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.gettingStarted.quickstart', {
        defaultMessage: 'OpenSearch Dashboards quickstart',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
    },
    {
      label: i18n.translate('home.basics.gettingStarted.dataVis', {
        defaultMessage: 'Building data visualizations',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/',
    },
    {
      label: i18n.translate('home.basics.gettingStarted.dashboards', {
        defaultMessage: 'Creating dashboards',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/',
    },
  ];

  const dataDiscoveryLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.dataDiscovery.exploration', {
        defaultMessage: 'Get familiar with Discover',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/discover/index-discover/',
    },
    {
      label: i18n.translate('home.basics.dataDiscovery.sources', {
        defaultMessage: 'Run queries in the Dev Tools Console',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/dev-tools/run-queries/',
    },
    {
      label: i18n.translate('home.basics.dataDiscovery.vis', {
        defaultMessage: 'Working with indexes',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/im-dashboards/index/',
    },
  ];

  const observabilityLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.observability.logExplorer', {
        defaultMessage: 'Get familiar with Log Explorer',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/event-analytics/',
    },
    {
      label: i18n.translate('home.basics.observability.prometheus', {
        defaultMessage: 'Explore prometheus metrics',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/prometheusmetrics/',
    },
    {
      label: i18n.translate('home.basics.observability.traces', {
        defaultMessage: 'Dive into traces and spans',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/trace/ta-dashboards/',
    },
  ];

  function renderCard(iconType: IconType, title: string, listItems: EuiListGroupItemProps[]) {
    return (
      <EuiCard
        display="plain"
        icon={<EuiIcon type={iconType} size="xl" />}
        title={
          <>
            {title} <EuiIcon type="popout" />
          </>
        }
        layout="horizontal"
      >
        <EuiListGroup className="home-basics-listGroup" listItems={listItems} />
      </EuiCard>
    );
  }

  const categories = (
    <EuiFlexGroup wrap direction="row" alignItems="stretch">
      <EuiFlexItem>
        {renderCard(
          logos.Mark.url,
          i18n.translate('home.basics.gettingStarted.title', {
            defaultMessage: 'Getting started',
          }),
          gettingStartedLinks
        )}
      </EuiFlexItem>
      <EuiFlexItem>
        {renderCard(
          'discoverApp',
          i18n.translate('home.basics.dataDiscovery.title', {
            defaultMessage: 'Explore data',
          }),
          dataDiscoveryLinks
        )}
      </EuiFlexItem>
      <EuiFlexItem>
        {renderCard(
          'eye',
          i18n.translate('home.basics.dataDiscovery.title', {
            defaultMessage: 'Observability',
          }),
          observabilityLinks
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <Section
      title={i18n.translate('home.basics.title', { defaultMessage: 'Learn OpenSearch basics' })}
      description={i18n.translate('home.basics.description', {
        defaultMessage: 'Core concepts to get you started with OpenSearch',
      })}
      links={[
        {
          text: i18n.translate('home.basics.documentation', { defaultMessage: 'Documentation' }),
          url: 'https://opensearch.org/docs/latest/',
        },
      ]}
      categories={categories}
      initiallyOpen={initiallyOpen}
    />
  );
};
