/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory } from '@storybook/react';
import { DiscoverDownloadCsvPopoverContent } from './download_csv_popover_content';

export default {
  component: DiscoverDownloadCsvPopoverContent,
  title:
    'src/plugins/discover/public/application/components/download_csv/download_csv_popover_content',
};

const Template: ComponentStory<typeof DiscoverDownloadCsvPopoverContent> = (args) => (
  <DiscoverDownloadCsvPopoverContent {...args} />
);

export const Primary = Template.bind({});

Primary.args = {
  downloadForOption: async (option) => {
    action(`Clicked for ${option}`);
  },
  hitsCount: 10000,
  rowsCount: 500,
};
