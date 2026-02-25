/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch } from './color_swatch';
import { OkSwatch } from './ok_swatch';
import { ErrorsSwatch } from './errors_swatch';
import { FaultsSwatch } from './faults_swatch';

const meta: Meta<typeof ColorSwatch> = {
  title: 'Components/Celestial/Swatches',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof ColorSwatch>;

export const Default: Story = {
  args: {
    color: '#007bff',
  },
  render: (args) => <ColorSwatch {...args} />,
};

export const CustomColors: Story = {
  render: () => (
    <div className="osd:flex osd:gap-4 osd:items-center">
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <ColorSwatch color="#FF0000" />
        <span className="osd:text-xs">Red</span>
      </div>
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <ColorSwatch color="#00FF00" />
        <span className="osd:text-xs">Green</span>
      </div>
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <ColorSwatch color="#0000FF" />
        <span className="osd:text-xs">Blue</span>
      </div>
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <ColorSwatch color="#FFFF00" />
        <span className="osd:text-xs">Yellow</span>
      </div>
    </div>
  ),
};

export const SystemSwatches: Story = {
  render: () => (
    <div className="osd:flex osd:gap-4 osd:items-center">
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <ErrorsSwatch />
        <span className="osd:text-xs">Errors</span>
      </div>
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <FaultsSwatch />
        <span className="osd:text-xs">Faults</span>
      </div>
      <div className="osd:flex osd:flex-col osd:items-center osd:gap-2">
        <OkSwatch />
        <span className="osd:text-xs">Ok</span>
      </div>
    </div>
  ),
};
