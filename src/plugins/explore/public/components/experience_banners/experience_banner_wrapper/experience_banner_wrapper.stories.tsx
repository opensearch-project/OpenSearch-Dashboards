/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ExperienceBannerWrapper } from './experience_banner_wrapper';

const navigateToExplore = action('navigateToExplore');
const mockInitializeBannerWrapperToTrue = async () => {
  return {
    showClassicExperienceBanner: true,
    navigateToExplore,
  };
};
const mockInitializeBannerWrapperToFalse = async () => {
  return {
    showClassicExperienceBanner: false,
    navigateToExplore,
  };
};

export default {
  component: ExperienceBannerWrapper,
  title: 'src/plugins/explore/public/components/experience_banners/experience_banner_wrapper',
};

const Template: ComponentStory<typeof ExperienceBannerWrapper> = (args) => (
  <ExperienceBannerWrapper {...args} />
);

export const WithNewExperience = Template.bind({});

WithNewExperience.args = {
  initializeBannerWrapper: mockInitializeBannerWrapperToTrue,
};

export const WithClassicExperience = Template.bind({});

WithClassicExperience.args = {
  initializeBannerWrapper: mockInitializeBannerWrapperToFalse,
};
