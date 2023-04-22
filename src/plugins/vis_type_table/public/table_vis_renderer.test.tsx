/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { unmountComponentAtNode } from 'react-dom';
import { act } from '@testing-library/react';

import { CoreStart } from 'opensearch-dashboards/public';
import { getTableVisRenderer } from './table_vis_renderer';
import { TableVisData } from './table_vis_response_handler';
import { TableVisConfig } from './types';
import { TableVisRenderValue } from './table_vis_fn';

const mockVisData = {
  tableGroups: [],
  direction: 'row',
} as TableVisData;

const mockVisConfig = {
  title: 'My Table',
  metrics: [] as any,
  buckets: [] as any,
} as TableVisConfig;

const mockHandlers = {
  done: jest.fn(),
  reload: jest.fn(),
  update: jest.fn(),
  event: jest.fn(),
  onDestroy: jest.fn(),
};

const mockCoreStart = {} as CoreStart;

describe('getTableVisRenderer', () => {
  let container: any = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  it('should render table visualization', async () => {
    const renderer = getTableVisRenderer(mockCoreStart);
    const mockTableVisRenderValue = {
      visData: mockVisData,
      visType: 'table',
      visConfig: mockVisConfig,
    } as TableVisRenderValue;
    await act(async () => {
      renderer.render(container, mockTableVisRenderValue, mockHandlers);
    });
    expect(container.querySelector('.tableVis')).toBeTruthy();
  });

  it('should destroy table on unmount', async () => {
    const renderer = getTableVisRenderer(mockCoreStart);
    const mockTableVisRenderValue = {
      visData: mockVisData,
      visType: 'table',
      visConfig: mockVisConfig,
    } as TableVisRenderValue;
    await act(async () => {
      renderer.render(container, mockTableVisRenderValue, mockHandlers);
    });
    await act(async () => {
      unmountComponentAtNode(container);
    });
    expect(mockHandlers.onDestroy).toHaveBeenCalled();
  });
});
