/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { NoMatchMessage } from './helper_functions';

// NoMatchMessage stories
export default {
  title:
    'src/plugins/explore/public/application/pages/traces/trace_details/public/utils/helper_functions/NoMatchMessage',
  component: NoMatchMessage,
  parameters: {
    docs: {
      description: {
        component: 'A component that displays an error message when a trace ID cannot be found.',
      },
    },
  },
} as ComponentMeta<typeof NoMatchMessage>;

const NoMatchMessageTemplate: ComponentStory<typeof NoMatchMessage> = (args) => (
  <NoMatchMessage {...args} />
);

export const Primary = NoMatchMessageTemplate.bind({});
Primary.args = {
  traceId: '1234567890abcdef',
};

export const LongTraceId = NoMatchMessageTemplate.bind({});
LongTraceId.args = {
  traceId: '1234567890abcdef1234567890abcdef1234567890abcdef',
};
