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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const Card: FC<{
  iconType: IconType;
  title: string;
  listItems: EuiListGroupItemProps[];
}> = ({ iconType, title, listItems }) => (
  <EuiFlexItem grow={1}>
    <EuiFlexGroup direction="row" alignItems="center" gutterSize="m" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiIcon type={iconType} size="xl" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiTitle size="s">
          <span>{title}</span>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiIcon type="popout" />
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="m" />
    <EuiListGroup listItems={listItems} flush />
  </EuiFlexItem>
);

const render = renderFn(() => {
  const services = getServices();
  const logos = services.chrome.logos;

  const gettingStartedLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.sections.learnBasics.gettingStarted.quickstart', {
        defaultMessage: 'OpenSearch Dashboards quickstart',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.gettingStarted.dataVis', {
        defaultMessage: 'Building data visualizations',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.gettingStarted.dashboards', {
        defaultMessage: 'Creating dashboards',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/',
      target: '_blank',
    },
  ];

  const dataDiscoveryLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.sections.learnBasics.dataDiscovery.getFamiliar', {
        defaultMessage: 'Get familiar with Discover',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/discover/index-discover/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.dataDiscovery.runQueries', {
        defaultMessage: 'Run queries in the Dev Tools Console',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/dev-tools/run-queries/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.dataDiscovery.indexes', {
        defaultMessage: 'Working with indexes',
      }),
      href: 'https://opensearch.org/docs/latest/dashboards/im-dashboards/index/',
      target: '_blank',
    },
  ];

  const observabilityLinks: EuiListGroupItemProps[] = [
    {
      label: i18n.translate('home.sections.learnBasics.observability.logExplorer', {
        defaultMessage: 'Get familiar with Log Explorer',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/event-analytics/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.observability.prometheus', {
        defaultMessage: 'Explore prometheus metrics',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/prometheusmetrics/',
      target: '_blank',
    },
    {
      label: i18n.translate('home.sections.learnBasics.observability.traces', {
        defaultMessage: 'Dive into traces and spans',
      }),
      href: 'https://opensearch.org/docs/latest/observing-your-data/trace/ta-dashboards/',
      target: '_blank',
    },
  ];

  return (
    <EuiPanel>
      <EuiFlexGroup wrap direction="row" alignItems="stretch" gutterSize="xl">
        <Card
          iconType={logos.Mark.url}
          title={i18n.translate('home.sections.learnBasics.gettingStarted.title', {
            defaultMessage: 'Getting started',
          })}
          listItems={gettingStartedLinks}
        />
        <Card
          iconType="discoverApp"
          title={i18n.translate('home.sections.learnBasics.dataDiscovery.title', {
            defaultMessage: 'Explore data',
          })}
          listItems={dataDiscoveryLinks}
        />
        <Card
          iconType="eye"
          title={i18n.translate('home.sections.learnBasics.observability.title', {
            defaultMessage: 'Observability',
          })}
          listItems={observabilityLinks}
        />
      </EuiFlexGroup>
    </EuiPanel>
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
