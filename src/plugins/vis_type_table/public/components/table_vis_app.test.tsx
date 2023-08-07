/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../core/public/mocks';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { TableVisApp } from './table_vis_app';
import { TableVisConfig } from '../types';
import { TableVisData } from '../table_vis_response_handler';

jest.mock('./table_vis_component_group', () => ({
  TableVisComponentGroup: () => (
    <div data-test-subj="TableVisComponentGroup">TableVisComponentGroup</div>
  ),
}));

jest.mock('./table_vis_component', () => ({
  TableVisComponent: () => <div data-test-subj="TableVisComponent">TableVisComponent</div>,
}));

describe('TableVisApp', () => {
  const serviceMock = coreMock.createStart();
  const handlersMock = ({
    done: jest.fn(),
    uiState: {
      get: jest.fn((key) => {
        switch (key) {
          case 'vis.sortColumn':
            return {};
          case 'vis.columnsWidth':
            return [];
          default:
            return undefined;
        }
      }),
      set: jest.fn(),
    },
    event: 'event',
  } as unknown) as IInterpreterRenderHandlers;
  const visConfigMock = ({} as unknown) as TableVisConfig;

  it('should render TableVisComponent if no split table', () => {
    const visDataMock = {
      table: {
        columns: [],
        rows: [],
        formattedColumns: [],
      },
      tableGroups: [],
    } as TableVisData;
    const { getByTestId } = render(
      <TableVisApp
        services={serviceMock}
        visData={visDataMock}
        visConfig={visConfigMock}
        handlers={handlersMock}
      />
    );
    expect(getByTestId('TableVisComponent')).toBeInTheDocument();
  });

  it('should render TableVisComponentGroup component if split direction is column', () => {
    const visDataMock = {
      tableGroups: [],
      direction: 'column',
    } as TableVisData;
    const { container, getByTestId } = render(
      <TableVisApp
        services={serviceMock}
        visData={visDataMock}
        visConfig={visConfigMock}
        handlers={handlersMock}
      />
    );
    expect(container.outerHTML.includes('visTable')).toBe(true);
    expect(getByTestId('TableVisComponentGroup')).toBeInTheDocument();
  });

  it('should render TableVisComponentGroup component if split direction is row', () => {
    const visDataMock = {
      tableGroups: [],
      direction: 'row',
    } as TableVisData;
    const { container, getByTestId } = render(
      <TableVisApp
        services={serviceMock}
        visData={visDataMock}
        visConfig={visConfigMock}
        handlers={handlersMock}
      />
    );
    expect(container.outerHTML.includes('visTable')).toBe(true);
    expect(getByTestId('TableVisComponentGroup')).toBeInTheDocument();
  });
});
