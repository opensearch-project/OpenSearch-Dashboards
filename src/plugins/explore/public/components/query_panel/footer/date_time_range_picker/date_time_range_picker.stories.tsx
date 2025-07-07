/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateTimeRangePicker } from './date_time_range_picker';
import { StorybookProviders } from '../../mock_provider.mocks';

const meta: Meta<typeof DateTimeRangePicker> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/date_time_range_picker',
  component: DateTimeRangePicker,
  decorators: [
    (Story) => (
      <StorybookProviders>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '200px' }}>
          <h3>Date Time Range Picker</h3>
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
The DateTimeRangePicker component provides time range selection functionality for the Explore plugin.
It wraps the EUI SuperDatePicker component and integrates with the query state management.

## Features
- Time range selection with commonly used presets
- Refresh interval configuration
- Integration with query execution
- Customizable date format
- Auto-refresh functionality

## Usage
This component is typically used in the query panel footer to allow users to select time ranges for their queries.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateTimeRangePicker>;

export const Default: Story = {
  name: 'Default Configuration',
  parameters: {
    docs: {
      description: {
        story:
          'Default date time range picker with standard commonly used ranges and 15-minute default range.',
      },
    },
  },
};
