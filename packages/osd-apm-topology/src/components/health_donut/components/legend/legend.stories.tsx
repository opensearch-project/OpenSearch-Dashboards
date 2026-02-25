/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Meta, StoryObj } from '@storybook/react';
import type { Metrics } from '../../../../shared/types/common.types';
import { Legend } from './legend';

const meta: Meta<typeof Legend> = {
  title: 'Components/HealthDonut/Legend',
  component: Legend,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    trianglePosition: {
      control: 'radio',
      options: ['left', 'right'],
      defaultValue: 'left',
      description: 'Position of the triangle pointer',
    },
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof Legend>;

// Mock data for the stories
const createMockData = (requests: number, errors4xx: number, faults5xx: number): Metrics => ({
  requests,
  errors4xx,
  faults5xx,
});

// Data with high error rates
const highErrorData = createMockData(1000, 200, 100);

// Data with low error rates
const lowErrorData = createMockData(1000, 20, 10);

export const LeftTriangle: Story = {
  args: {
    trianglePosition: 'left',
    metrics: highErrorData,
  },
};

export const RightTriangle: Story = {
  args: {
    trianglePosition: 'right',
    metrics: highErrorData,
  },
};

export const WithLowErrorRates: Story = {
  args: {
    trianglePosition: 'left',
    metrics: lowErrorData,
  },
};

export const RightTriangleWithLowErrorRates: Story = {
  args: {
    trianglePosition: 'right',
    metrics: lowErrorData,
  },
};
