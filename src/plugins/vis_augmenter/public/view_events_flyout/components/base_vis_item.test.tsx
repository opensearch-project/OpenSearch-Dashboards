/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BaseVisItem } from './base_vis_item';
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

describe('<BaseVisItem/>', () => {
  it('renders', async () => {
    const embeddable = createMockVisEmbeddable();
    const { getByTestId } = render(<BaseVisItem embeddable={embeddable} />);
    expect(getByTestId('baseVis')).toBeInTheDocument();
  });
});
