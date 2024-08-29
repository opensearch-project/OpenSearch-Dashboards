/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiDescriptionList,
  EuiText,
  EuiLink,
  EuiTitle,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS,
  ContentManagementPluginStart,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
} from '../../../../content_management/public';

export const LEARN_OPENSEARCH_CONFIG = {
  title: i18n.translate('homepage.card.learnOpenSearch.title', {
    defaultMessage: 'Learn Opensearch',
  }),
  list: [
    {
      label: 'Quickstart guide',
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
      description: 'Get started in minutes with OpenSearch Dashboards',
    },
    {
      label: 'Building data visualizations',
      href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/',
      description: 'Design interactive charts and graphs to unlock insights form your data.',
    },
    {
      label: 'Creating dashboards',
      href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/',
      description: 'Build interactive dashboards to explore and analyze your data',
    },
  ],
  allLink: 'https://opensearch.org/docs/latest/',
};

export const WHATS_NEW_CONFIG = {
  title: i18n.translate('homepage.card.whatsNew.title', {
    defaultMessage: `What's New`,
  }),
  list: [
    {
      label: 'Quickstart guide',
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
      description: 'Get started in minutes with OpenSearch Dashboards',
    },
  ],
};

interface Config {
  title: string;
  list: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  allLink?: string;
}

export const HomeListCard = ({ config }: { config: Config }) => {
  return (
    <>
      <EuiPanel hasBorder={false} hasShadow={false}>
        <EuiFlexGroup
          direction="column"
          justifyContent="spaceBetween"
          style={{ height: '100%' }}
          gutterSize="none"
        >
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>{config.title}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiSpacer />
          <EuiFlexItem style={{ overflow: 'auto' }} grow={true}>
            {config.list.length > 0 && (
              <EuiDescriptionList>
                {config.list.map((item) => (
                  <React.Fragment key={item.href}>
                    <EuiDescriptionListTitle>
                      <EuiLink href={item.href} target="_blank">
                        {item.label}
                      </EuiLink>
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {item.description}
                    </EuiDescriptionListDescription>
                  </React.Fragment>
                ))}
              </EuiDescriptionList>
            )}
          </EuiFlexItem>
          <EuiSpacer />
          <EuiFlexItem grow={false}>
            {config.allLink ? (
              <EuiLink href={config.allLink} target="_blank">
                <EuiText size="s" className="eui-displayInline">
                  {i18n.translate('home.list.card.view_all', {
                    defaultMessage: 'View all',
                  })}
                </EuiText>
              </EuiLink>
            ) : null}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
};

export const registerHomeListCard = (
  contentManagement: ContentManagementPluginStart,
  {
    target,
    order,
    width,
    config,
    id,
  }: {
    target: string;
    order: number;
    width?: number;
    config: Config;
    id: string;
  }
) => {
  contentManagement.registerContentProvider({
    id: `${id}_${target}_cards`,
    getContent: () => ({
      id,
      kind: 'custom',
      order,
      width,
      render: () =>
        React.createElement(HomeListCard, {
          config,
        }),
    }),
    getTargetArea: () => target,
  });
};
export const registerHomeListCardToPage = (contentManagement: ContentManagementPluginStart) => {
  registerHomeListCard(contentManagement, {
    id: 'whats_new',
    order: 10,
    config: WHATS_NEW_CONFIG,
    target: ESSENTIAL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
    width: 24,
  });

  registerHomeListCard(contentManagement, {
    id: 'learn_opensearch_new',
    order: 20,
    config: LEARN_OPENSEARCH_CONFIG,
    target: ESSENTIAL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
    width: 24,
  });

  registerHomeListCard(contentManagement, {
    id: 'whats_new',
    order: 30,
    config: WHATS_NEW_CONFIG,
    target: ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });

  registerHomeListCard(contentManagement, {
    id: 'learn_opensearch_new',
    order: 40,
    config: LEARN_OPENSEARCH_CONFIG,
    target: ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });
};
