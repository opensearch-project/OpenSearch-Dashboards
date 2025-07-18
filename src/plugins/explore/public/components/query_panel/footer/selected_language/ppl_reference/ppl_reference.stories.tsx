/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PplReference } from './ppl_reference';
import { StorybookProviders } from '../../../mock_provider.mocks';

const meta: Meta<typeof PplReference> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/detected_language/ppl_reference',
  component: PplReference,
  decorators: [
    (Story) => (
      <StorybookProviders>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
          <h3>PPL Reference</h3>
          <div style={{ marginTop: '20px' }}>
            <Story />
          </div>
        </div>
      </StorybookProviders>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The PplReference component displays information about Piped Processing Language (PPL) with links to documentation.

## Features
- Displays PPL description with internationalization support
- Provides links to PPL documentation
- Links to SQL/PPL limitations documentation
- Uses EUI components for consistent styling
- Integrates with OpenSearch Dashboards services for document links

## Usage
This component is typically used within the query panel footer to provide contextual help for PPL query language.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PplReference>;

export const Default: Story = {
  name: 'Default PPL Reference',
  parameters: {
    docs: {
      description: {
        story:
          'Default PPL reference component showing the standard description with documentation links.',
      },
    },
  },
};
