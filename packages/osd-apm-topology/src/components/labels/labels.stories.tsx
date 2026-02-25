/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { AlarmLabel } from './alarm_label';
import { BreachedLabel } from './breached_label';
import { ErrorsLabel } from './errors_label';
import { FaultsLabel } from './faults_label';
import { RecoveredLabel } from './recovered_label';
import { OkLabel } from './ok_label';

const meta: Meta<typeof Label> = {
  title: 'Components/Celestial/Labels',
  component: Label,
  parameters: {
    layout: 'centered',
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    text: 'Default Label',
    children: <div className="osd:w-4 osd:h-4 osd:bg-blue-500 osd:rounded-full" />,
  },
};

export const AllLabels: Story = {
  render: () => (
    <div className="osd:flex osd:flex-col osd:gap-4">
      <div className="osd:flex osd:flex-col osd:gap-2">
        <h3 className="osd:text-sm osd:font-medium">Base Label</h3>
        <Label text="Base Label">
          <div className="osd:w-4 osd:h-4 osd:bg-blue-500 osd:rounded-full" />
        </Label>
      </div>

      <div className="osd:flex osd:flex-col osd:gap-2">
        <h3 className="osd:text-sm osd:font-medium">Status Labels</h3>
        <div className="osd:flex osd:gap-4">
          <AlarmLabel text="Alarm" />
          <BreachedLabel text="Breached" />
          <RecoveredLabel text="Recovered" />
        </div>
      </div>

      <div className="osd:flex osd:flex-col osd:gap-2">
        <h3 className="osd:text-sm osd:font-medium">Metric Labels</h3>
        <div className="osd:flex osd:gap-4">
          <ErrorsLabel text="Errors" />
          <FaultsLabel text="Faults" />
          <OkLabel text="Ok" />
        </div>
      </div>
    </div>
  ),
};

export const StatusLabels: Story = {
  render: () => (
    <div className="osd:flex osd:gap-4">
      <AlarmLabel text="Alarm" />
      <BreachedLabel text="Breached" />
      <RecoveredLabel text="Recovered" />
    </div>
  ),
};

export const MetricLabels: Story = {
  render: () => (
    <div className="osd:flex osd:gap-4">
      <ErrorsLabel text="Errors" />
      <FaultsLabel text="Faults" />
      <OkLabel text="Ok" />
    </div>
  ),
};

export const CustomLabel: Story = {
  render: () => (
    <Label text="Custom Label">
      <div className="osd:w-4 osd:h-4 osd:bg-purple-500 osd:rounded-full" />
    </Label>
  ),
};
