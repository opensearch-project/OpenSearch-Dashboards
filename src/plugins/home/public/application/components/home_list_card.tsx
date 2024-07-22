/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCard, EuiLink, EuiListGroup } from '@elastic/eui';

export const LEARN_OPENSEARCH_CONFIG = {
  title: 'Learn Opensearch',
  list: [
    {
      label: 'Quickstart guide',
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
      target: '_blank',
    },
    {
      label: 'Building data visualizations',
      href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/',
      target: '_blank',
    },
    {
      label: 'Creating dashboards',
      href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/',
      target: '_blank',
    },
  ],
  allLink: 'https://opensearch.org/docs/latest/',
};

export const WHATS_NEW_CONFIG = {
  title: `What's New`,
  list: [
    {
      label: 'Quickstart guide',
      href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
      target: '_blank',
    },
  ],
};

interface Config {
  title: string;
  list: Array<{
    label: string;
    href: string;
    target?: string;
  }>;
  allLink?: string;
}

export const HomeListCard = ({ config }: { config: Config }) => {
  return (
    <>
      <EuiCard
        title={config.title}
        description={false}
        hasBorder={false}
        display="plain"
        footer={
          config.allLink ? (
            <EuiLink href={config.allLink} external>
              view all
            </EuiLink>
          ) : null
        }
      >
        <EuiListGroup listItems={config.list} color="text" size="s" />
      </EuiCard>
    </>
  );
};
