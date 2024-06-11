/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { EventVisItem } from './event_vis_item';
import {
  createMockEventVisEmbeddableItem,
  createMockVisEmbeddable,
  createPluginResource,
  createPointInTimeEventsVisLayer,
} from '../../mocks';

jest.mock('../../services', () => {
  return {
    getEmbeddable: () => {
      return {
        getEmbeddablePanel: () => {
          return 'MockEmbeddablePanel';
        },
      };
    },
    getCore: () => {
      return {
        http: {
          basePath: {
            prepend: jest.fn(),
          },
        },
      };
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('<EventVisItem/>', () => {
  it('renders', async () => {
    const item = createMockEventVisEmbeddableItem();
    const { getByTestId, getByText } = render(<EventVisItem item={item} />);
    expect(getByTestId('eventVis')).toBeInTheDocument();
    expect(getByTestId('pluginResourceDescription')).toBeInTheDocument();
    expect(getByText(item.visLayer.pluginResource.name)).toBeInTheDocument();
  });

  it('shows event count when rendering a PointInTimeEventsVisLayer', async () => {
    const eventCount = 5;
    const pluginResource = createPluginResource();
    const visLayer = createPointInTimeEventsVisLayer('test-plugin', pluginResource, eventCount);
    const embeddable = createMockVisEmbeddable();
    const item = {
      visLayer,
      embeddable,
    };
    const { getByTestId, getByText } = render(<EventVisItem item={item} />);
    expect(getByTestId('eventCount')).toBeInTheDocument();
    expect(getByText(eventCount)).toBeInTheDocument();
  });
});
