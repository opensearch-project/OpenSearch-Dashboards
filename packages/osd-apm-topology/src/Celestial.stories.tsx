/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Celestial } from './Celestial';
import type { CelestialMapProps } from './types';
import { createInitialNodes } from './fixtures/basic.fixture';
import { nodeMap } from './fixtures/groups.fixture';
import { layoutMap } from './fixtures/layout.fixture';
import { CelestialMap } from './CelestialMap';

const meta: Meta<typeof Celestial> = {
  title: 'Components/Celestial/Map',
  component: Celestial,
};

// eslint-disable-next-line import/no-default-export
export default meta;

type Story = StoryObj<typeof Celestial>;

const CelestialTemplate = (props: CelestialMapProps) => {
  // At the top of your application tree:
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CelestialMap {...props} />
    </div>
  );
};

// Does not use react state
export const Plain: Story = {
  render: CelestialTemplate,
  args: {
    map: {
      root: {
        nodes: createInitialNodes(20),
        edges: [],
      },
    },
  } as CelestialMapProps,
};

export const PlainLoading: Story = {
  render: CelestialTemplate,
  args: {
    map: {
      root: {
        nodes: createInitialNodes(20),
        edges: [],
      },
    },
    isLoading: true,
  } as CelestialMapProps,
};

export const Groups: Story = {
  render: CelestialTemplate,
  args: {
    map: nodeMap,
    onGroupBy: (event: any, detail: any) => {
      // eslint-disable-next-line no-console
      console.log('onGroupBy', event, detail);
    },
  },
};

export const DefaultLayout: Story = {
  render: CelestialTemplate,
  args: {
    map: layoutMap,
    onGroupBy: (event: any, detail: any) => {
      // eslint-disable-next-line no-console
      console.log('onGroupBy', event, detail);
    },
  },
};

export const TopBottomLayout: Story = {
  render: CelestialTemplate,
  args: {
    map: layoutMap,
    layoutOptions: {
      direction: 'TB',
      rankSeparation: 150,
      nodeSeparation: 80,
    },
  },
};

export const NodesInFocusLayout: Story = {
  render: CelestialTemplate,
  args: {
    map: layoutMap,
    onGroupBy: (event: any, detail: any) => {
      // eslint-disable-next-line no-console
      console.log('onGroupBy', event, detail);
    },
    nodesInFocus: [layoutMap.root.nodes[2]],
  },
};

export const WithStackedNodes: Story = {
  render: CelestialTemplate,
  args: {
    map: {
      root: layoutMap.stacked,
    },
    topN: 10,
  },
};

export const WithStackedNodesAndFilter: Story = {
  render: CelestialTemplate,
  args: {
    map: {
      root: layoutMap.stacked,
    },
    nodesInFocus: [layoutMap.stacked.nodes[2]],
  },
};
