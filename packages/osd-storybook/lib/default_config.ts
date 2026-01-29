/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorybookConfig } from '@storybook/react-webpack5';

export const defaultConfig: StorybookConfig = {
  addons: ['@osd/storybook/preset', '@storybook/addon-controls', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  stories: ['../**/*.stories.tsx'],
  typescript: {
    reactDocgen: false,
    check: false,
    checkOptions: {},
  },
};
