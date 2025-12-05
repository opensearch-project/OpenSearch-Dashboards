/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory } from '@storybook/react';
import { NewExperienceBanner } from './new_experience_banner';

export default {
  component: NewExperienceBanner,
  title: 'src/plugins/explore/public/components/experience_banners/new_experience_banner',
};

const Template: ComponentStory<typeof NewExperienceBanner> = () => <NewExperienceBanner />;

export const Primary = Template.bind({});

Primary.args = {};
