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
  EuiPanel,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiSpacer,
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
        <EuiTitle>
          <h4>{config.title}</h4>
        </EuiTitle>
        <EuiSpacer />
        {config.list.length > 0 && (
          <EuiDescriptionList>
            {config.list.map((item) => (
              <>
                <EuiDescriptionListTitle>
                  <EuiLink href={item.href} target="_blank">
                    {item.label}
                  </EuiLink>
                </EuiDescriptionListTitle>
                <EuiDescriptionListDescription>{item.description}</EuiDescriptionListDescription>
              </>
            ))}
          </EuiDescriptionList>
        )}

        {config.allLink ? (
          <>
            <EuiSpacer />
            <EuiLink href={config.allLink} target="_blank">
              <EuiText size="s" style={{ display: 'inline' }}>
                View all
              </EuiText>
            </EuiLink>
          </>
        ) : null}
      </EuiPanel>
    </>
  );
};
