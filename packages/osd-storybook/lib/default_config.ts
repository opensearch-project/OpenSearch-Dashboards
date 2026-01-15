/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorybookConfig } from '@storybook/core-common';

export const defaultConfig: StorybookConfig = {
  addons: ['@osd/storybook/preset', '@storybook/addon-knobs', '@storybook/addon-essentials'],
  core: {
    builder: 'webpack5',
  },
  stories: ['../**/*.stories.tsx'],
  typescript: {
    reactDocgen: false,
  },
};
