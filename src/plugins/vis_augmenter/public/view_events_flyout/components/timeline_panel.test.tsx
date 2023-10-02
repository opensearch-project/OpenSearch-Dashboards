/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TimelinePanel } from './timeline_panel';
import { createMockVisEmbeddable } from '../../mocks';

jest.mock('../../services', () => {
  return {
    getEmbeddable: () => {
      return {
        getEmbeddablePanel: () => {
          return 'MockEmbeddablePanel';
        },
      };
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('<TimelinePanel/>', () => {
  it('renders', async () => {
    const embeddable = createMockVisEmbeddable();
    const { getByTestId } = render(<TimelinePanel embeddable={embeddable} />);
    expect(getByTestId('timelineVis')).toBeInTheDocument();
  });
});
