/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Loader } from './loader';

const meta: Meta<typeof Loader> = {
  title: 'Components/Celestial/Loader',
  component: Loader,
  parameters: {
    layout: 'centered',
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof Loader>;

const LoaderTemplate = () => (
  <div className="osd:flex osd:items-center osd:justify-center osd:min-h-screen">
    <Loader />
  </div>
);

export const Default: Story = {
  render: LoaderTemplate,
};
