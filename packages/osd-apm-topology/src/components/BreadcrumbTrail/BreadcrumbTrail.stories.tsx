/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Meta, StoryObj } from '@storybook/react';
import { ApiGatewayIcon, DynamodbIcon, LambdaIcon } from '../../shared/resources/services';
import { BreadcrumbTrail } from './BreadcrumbTrail';

const meta: Meta<typeof BreadcrumbTrail> = {
  title: 'Components/Celestial/BreadcrumbTrail',
  component: BreadcrumbTrail,
  parameters: {
    layout: 'centered',
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof BreadcrumbTrail>;

export const Default: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'All Services',
      },
      {
        title: 'API Gateway',
        node: {
          id: 'api-1',
          title: 'API Gateway',
          keyAttributes: { foo: 'bar' },
          icon: <img src={ApiGatewayIcon} className="osd:w-5 osd:h-5" alt="" />,
          metrics: {
            requests: 1000,
            faults5xx: 10,
            errors4xx: 20,
          },
        },
      },
      {
        title: 'Lambda Function',
        node: {
          id: 'lambda-1',
          title: 'Lambda Function',
          keyAttributes: { foo: 'bar2' },
          icon: <img src={LambdaIcon} className="osd:w-5 osd:h-5" alt="" />,
          metrics: {
            requests: 800,
            faults5xx: 5,
            errors4xx: 10,
          },
        },
      },
    ],
    onBreadcrumbClick: (breadcrumb, index) => {
      // eslint-disable-next-line no-console
      console.log('Breadcrumb clicked:', breadcrumb, 'at index:', index);
    },
  },
};

export const WithAlarming: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'All Services',
      },
      {
        title: 'API Gateway',
        node: {
          id: 'api-1',
          title: 'API Gateway',
          keyAttributes: { foo: 'bar1' },
          icon: <img src={ApiGatewayIcon} className="osd:w-5 osd:h-5" alt="" />,
          metrics: {
            requests: 1000,
            faults5xx: 10,
            errors4xx: 20,
          },
        },
      },
      {
        title: 'Lambda Function',
        node: {
          id: 'lambda-1',
          title: 'Lambda Function',
          keyAttributes: { foo: 'bar2' },
          icon: <img src={LambdaIcon} className="osd:w-5 osd:h-5" alt="" />,
          health: {
            status: 'breached',
            breached: 1,
            recovered: 0,
            total: 1,
          },
          metrics: {
            requests: 800,
            faults5xx: 200,
            errors4xx: 50,
          },
        },
      },
      {
        title: 'Database',
        node: {
          id: 'db-1',
          title: 'Database',
          keyAttributes: { foo: 'bar3' },
          icon: <img src={DynamodbIcon} className="osd:w-5 osd:h-5" alt="" />,
          metrics: {
            requests: 500,
            faults5xx: 0,
            errors4xx: 5,
          },
        },
      },
    ],
    onBreadcrumbClick: (breadcrumb, index) => {
      // eslint-disable-next-line no-console
      console.log('Breadcrumb clicked:', breadcrumb, 'at index:', index);
    },
  },
};

export const SingleItem: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'All Services',
      },
    ],
    onBreadcrumbClick: (breadcrumb, index) => {
      // eslint-disable-next-line no-console
      console.log('Breadcrumb clicked:', breadcrumb, 'at index:', index);
    },
  },
};
