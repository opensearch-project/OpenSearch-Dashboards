/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { TitleOptionsPanel } from './title';
import { TitleOptions } from '../../types';

export default {
  component: TitleOptionsPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/title/title.tsx',
} as ComponentMeta<typeof TitleOptionsPanel>;

const mockTitle: TitleOptions = {
  show: true,
  titleName: 'Chart Title',
};

const Template: ComponentStory<typeof TitleOptionsPanel> = (args) => {
  const [title, setTitle] = useState<TitleOptions>(args.titleOptions);

  const handleTitleOptionsChange = (newTitle: Partial<TitleOptions>) => {
    setTitle((prev) => ({
      ...prev,
      ...newTitle,
    }));
    action('onShowTitleChange')(newTitle);
  };

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <TitleOptionsPanel titleOptions={title} onShowTitleChange={handleTitleOptionsChange} />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  titleOptions: mockTitle,
};

// Hidden title story
export const HiddenTitle = Template.bind({});
HiddenTitle.args = {
  titleOptions: {
    show: false,
    titleName: '',
  },
};
