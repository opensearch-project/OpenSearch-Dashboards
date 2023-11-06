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
} from '@elastic/eui';
import { Section } from './section';

export const BasicsSection: React.FC = () => {
  const gettingStartedLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.gettingStarted.quickstart', {
        defaultMessage: 'OpenSearch Dashboards quickstart',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.gettingStarted.dataVis', {
        defaultMessage: 'Building data visualizations',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.gettingStarted.dashboards', {
        defaultMessage: 'Creating dashboards',
      }),
      href: 'https://google.com',
    },
  ];

  const dataDiscoveryLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.dataDiscovery.exploration', {
        defaultMessage: 'Get familiar with Discover',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.dataDiscovery.sources', {
        defaultMessage: 'Run queries in the Dev Tools Console',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.dataDiscovery.vis', {
        defaultMessage: 'Working with indexes',
      }),
      href: 'https://google.com',
    },
  ];

  const observabilityLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.basics.observability.logExplorer', {
        defaultMessage: 'Get familiar with Log Explorer',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.observability.prometheus', {
        defaultMessage: 'Explore prometheus metrics',
      }),
      href: 'https://google.com',
    },
    {
      label: i18n.translate('home.basics.observability.traces', {
        defaultMessage: 'Dive into traces and spans',
      }),
      href: 'https://google.com',
    },
  ];

  const categories = (
    <EuiFlexGroup direction="row" alignItems="stretch">
      <EuiFlexItem>
        <EuiCard
          display="plain"
          icon={<EuiIcon type="logoOpenSearch" size="xl" />}
          title={i18n.translate('home.basics.gettingStarted.title', {
            defaultMessage: 'Getting started',
          })}
          layout="horizontal"
        >
          <EuiListGroup listItems={gettingStartedLinks} />
        </EuiCard>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiCard
          display="plain"
          icon={<EuiIcon type="discoverApp" size="xl" />}
          title={i18n.translate('home.basics.dataDiscovery.title', {
            defaultMessage: 'Explore data',
          })}
          layout="horizontal"
        >
          <EuiListGroup listItems={dataDiscoveryLinks} />
        </EuiCard>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiCard
          display="plain"
          icon={<EuiIcon type="eye" size="xl" />}
          title={i18n.translate('home.basics.dataDiscovery.title', {
            defaultMessage: 'Observability',
          })}
          layout="horizontal"
        >
          <EuiListGroup listItems={observabilityLinks} />
        </EuiCard>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <Section
      title={i18n.translate('home.basics.title', { defaultMessage: 'Lean OpenSearch basics' })}
      description={i18n.translate('home.basics.description', {
        defaultMessage: 'Core concepts to get you started with OpenSearch',
      })}
      links={[
        {
          text: i18n.translate('home.basics.documentation', { defaultMessage: 'Documentation' }),
          url: 'https://google.com',
        },
      ]}
      categories={categories}
    />
  );
};
