/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { PatternsTable, PatternItem } from './patterns_table';
import { mockPatternItems } from './constants';

export default {
  component: PatternsTable,
  title: 'src/plugins/explore/public/components/patterns_table/patterns_table',
} as ComponentMeta<typeof PatternsTable>;

const Template: ComponentStory<typeof PatternsTable> = (args) => <PatternsTable {...args} />;

// Create a larger dataset for pagination testing
const generateLargeDataset = (baseItems: PatternItem[], count: number): PatternItem[] => {
  const result: PatternItem[] = [...baseItems];

  for (let i = 0; i < count; i++) {
    const baseItem = baseItems[i % baseItems.length];
    result.push({
      pattern: `${baseItem.pattern} (variant ${Math.floor(i / baseItems.length) + 1})`,
      ratio: baseItem.ratio / (Math.floor(i / baseItems.length) + 2), // divides the canon num by 2 every iter.
      count: Math.floor(baseItem.count / (Math.floor(i / baseItems.length) + 2)), // same as above
    });
  }

  return result;
};

export const Default = Template.bind({});
Default.args = {
  items: mockPatternItems,
};

export const Empty = Template.bind({});
Empty.args = {
  items: [],
};

export const SingleItem = Template.bind({});
SingleItem.args = {
  items: [mockPatternItems[0]],
};

export const WithPagination = Template.bind({});
WithPagination.args = {
  items: generateLargeDataset(mockPatternItems, 30),
};

export const WithEmptyPatterns = Template.bind({});
WithEmptyPatterns.args = {
  items: [
    {
      pattern: '',
      ratio: 0.15,
      count: 150,
    },
    {
      pattern: (null as unknown) as string,
      ratio: 0.1,
      count: 100,
    },
    {
      pattern: (undefined as unknown) as string,
      ratio: 0.05,
      count: 50,
    },
    ...mockPatternItems.slice(0, 3),
  ],
};

export const WithLongLengthPatterns = Template.bind({});
WithLongLengthPatterns.args = {
  items: [
    {
      pattern:
        'INFO [main] ' + 'Very long log message that exceeds typical display width. '.repeat(10),
      ratio: 0.35,
      count: 350,
    },
    {
      pattern:
        'DEBUG [worker-1] ' +
        'This is an extremely verbose debug message with lots of details. '.repeat(10),
      ratio: 0.25,
      count: 250,
    },
    ...mockPatternItems.slice(0, 3),
  ],
};
