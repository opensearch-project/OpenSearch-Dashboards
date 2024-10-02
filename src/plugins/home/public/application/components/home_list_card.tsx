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
import { DocLinksStart } from 'opensearch-dashboards/public';
import {
  ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS,
  ContentManagementPluginStart,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
} from '../../../../content_management/public';

export const getLearnOpenSearchConfig = (docLinks: DocLinksStart): Config => ({
  title: i18n.translate('home.card.learnOpenSearch.title', {
    defaultMessage: 'OpenSearch Documentation',
  }),
  list: [
    {
      label: 'Quickstart guide',
      href: docLinks.links.opensearchDashboards.dashboards.quickStart,
      description: 'Start using OpenSearch Dashboards in minutes.',
    },
    {
      label: 'Building data visualizations',
      href: docLinks.links.opensearchDashboards.visualize.guide,
      description: 'Design interactive charts and graphs to unlock insights form your data.',
    },
    {
      label: 'Creating dashboards',
      href: docLinks.links.opensearchDashboards.dashboards.createDashboards,
      description: 'Build interactive dashboards to explore and analyze your data.',
    },
  ],
  allLink: (
    <EuiLink href={docLinks.links.opensearchDashboards.introduction} target="_blank">
      <EuiText size="s" className="eui-displayInline">
        {i18n.translate('home.list.card.documentation', {
          defaultMessage: 'Learn more in Documentation',
        })}
      </EuiText>
    </EuiLink>
  ),
});

export const getWhatsNewConfig = (docLinks: DocLinksStart): Config => ({
  title: i18n.translate('home.card.whatsNew.title', {
    defaultMessage: `What's New`,
  }),
  list: [
    {
      label: 'Quickstart guide',
      href: docLinks.links.opensearchDashboards.dashboards.quickStart,
      description: 'Get started in minutes with OpenSearch Dashboards',
    },
  ],
  allLink: (
    <EuiLink href={docLinks.OPENSEARCH_WEBSITE_URL} target="_blank">
      <EuiText size="s" className="eui-displayInline">
        {i18n.translate('home.list.card.whatsnew', {
          defaultMessage: 'View all on OpenSearch.org',
        })}
      </EuiText>
    </EuiLink>
  ),
});

interface Config {
  title: string;
  list: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  allLink?: React.JSX.Element;
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
          <EuiFlexItem grow={false}>{config.allLink}</EuiFlexItem>
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
export const registerHomeListCardToPage = (
  contentManagement: ContentManagementPluginStart,
  docLinks: DocLinksStart
) => {
  registerHomeListCard(contentManagement, {
    id: 'learn_opensearch_new',
    order: 20,
    config: getLearnOpenSearchConfig(docLinks),
    target: ESSENTIAL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
    width: 48,
  });

  registerHomeListCard(contentManagement, {
    id: 'learn_opensearch_new',
    order: 40,
    config: getLearnOpenSearchConfig(docLinks),
    target: ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
    width: 16,
  });
};
