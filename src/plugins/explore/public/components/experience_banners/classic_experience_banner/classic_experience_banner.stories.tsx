/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ClassicExperienceBanner } from './classic_experience_banner';

export default {
  component: ClassicExperienceBanner,
  title: 'src/plugins/explore/public/components/experience_banners/classic_experience_banner',
};

const Template: ComponentStory<typeof ClassicExperienceBanner> = (props) => (
  <ClassicExperienceBanner {...props} />
);

export const Primary = Template.bind({});

Primary.args = {
  navigateToExplore: action('navigateToExplore'),
};
