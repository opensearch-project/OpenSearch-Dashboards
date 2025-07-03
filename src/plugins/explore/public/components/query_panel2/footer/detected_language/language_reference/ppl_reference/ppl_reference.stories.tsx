/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { PplReference } from './ppl_reference';

// Mock useOpenSearchDashboards to provide test doc links
jest.mock('../../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      docLinks: {
        links: {
          noDocumentation: {
            ppl: { base: 'https://storybook-ppl-docs' },
            sqlPplLimitation: { base: 'https://storybook-limitation-docs' },
          },
        },
      },
    },
  }),
}));

export default {
  title:
    'src/plugins/explore/public/components/query_panel2/components/footer/detected_language/language_reference/ppl_reference',
  component: PplReference,
} as ComponentMeta<typeof PplReference>;

const Template: ComponentStory<typeof PplReference> = () => <PplReference />;
