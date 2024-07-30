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
      <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
        <EuiFlexGroup
          direction="column"
          justifyContent="spaceBetween"
          style={{ height: '100%' }}
          gutterSize="none"
        >
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <h4>{config.title}</h4>
            </EuiTitle>
          </EuiFlexItem>
          <EuiSpacer />
          <EuiFlexItem style={{ overflow: 'auto' }} grow={true}>
            {config.list.length > 0 && (
              <EuiDescriptionList>
                {config.list.map((item) => (
                  <>
                    <EuiDescriptionListTitle>
                      <EuiLink href={item.href} target="_blank">
                        {item.label}
                      </EuiLink>
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {item.description}
                    </EuiDescriptionListDescription>
                  </>
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
