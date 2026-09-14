/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableHeaderColumn } from './table_header_column';
import { SortOrder } from '../../../saved_searches/types';

describe('TableHeaderColumn', () => {
  const defaultProps = {
    colLeftIdx: 0,
    colRightIdx: 2,
    displayName: 'Test Field' as React.ReactNode,
    isRemoveable: true,
    isSortable: true,
    name: 'testField',
    onChangeSortOrder: jest.fn(),
    onMoveColumn: jest.fn(),
    onRemoveColumn: jest.fn(),
    sortOrder: [] as SortOrder[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the column display name', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText('Test Field')).toBeInTheDocument();
  });

  it('renders with the correct data-test-subj', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByTestId('docTableHeader-testField')).toBeInTheDocument();
  });

  it('renders sort button when column is sortable', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByTestId('docTableHeaderFieldSort_testField')).toBeInTheDocument();
  });

  it('does not render sort button when column is not sortable', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} isSortable={false} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.queryByTestId('docTableHeaderFieldSort_testField')).not.toBeInTheDocument();
  });

  it('renders remove button when column is removeable', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByTestId('docTableRemoveHeader-testField')).toBeInTheDocument();
  });

  it('calls onRemoveColumn when remove button is clicked', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    fireEvent.click(screen.getByTestId('docTableRemoveHeader-testField'));
    expect(defaultProps.onRemoveColumn).toHaveBeenCalledWith('testField');
  });

  it('renders move-left button when colLeftIdx >= 0', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByTestId('docTableMoveLeftHeader-testField')).toBeInTheDocument();
  });

  it('does not render move-left button when colLeftIdx < 0', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} colLeftIdx={-1} />
          </tr>
        </thead>
      </table>
    );
    expect(screen.queryByTestId('docTableMoveLeftHeader-testField')).not.toBeInTheDocument();
  });

  it('calls onMoveColumn with left index when move-left is clicked', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} colLeftIdx={1} />
          </tr>
        </thead>
      </table>
    );
    fireEvent.click(screen.getByTestId('docTableMoveLeftHeader-testField'));
    expect(defaultProps.onMoveColumn).toHaveBeenCalledWith('testField', 1);
  });

  it('calls onMoveColumn with right index when move-right is clicked', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHeaderColumn {...defaultProps} colRightIdx={3} />
          </tr>
        </thead>
      </table>
    );
    fireEvent.click(screen.getByTestId('docTableMoveRightHeader-testField'));
    expect(defaultProps.onMoveColumn).toHaveBeenCalledWith('testField', 3);
  });

  describe('sort order cycling', () => {
    it('sets ascending sort when column is unsorted', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeaderColumn {...defaultProps} sortOrder={[]} />
            </tr>
          </thead>
        </table>
      );
      fireEvent.click(screen.getByTestId('docTableHeaderFieldSort_testField'));
      expect(defaultProps.onChangeSortOrder).toHaveBeenCalledWith([['testField', 'asc']]);
    });

    it('sets descending sort when column is ascending', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeaderColumn {...defaultProps} sortOrder={[['testField', 'asc']]} />
            </tr>
          </thead>
        </table>
      );
      fireEvent.click(screen.getByTestId('docTableHeaderFieldSort_testField'));
      expect(defaultProps.onChangeSortOrder).toHaveBeenCalledWith([['testField', 'desc']]);
    });

    it('cycles back to ascending when column is descending and is the only sort', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeaderColumn {...defaultProps} sortOrder={[['testField', 'desc']]} />
            </tr>
          </thead>
        </table>
      );
      fireEvent.click(screen.getByTestId('docTableHeaderFieldSort_testField'));
      expect(defaultProps.onChangeSortOrder).toHaveBeenCalledWith([['testField', 'asc']]);
    });

    it('removes sort when column is descending and other sorts exist', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeaderColumn
                {...defaultProps}
                sortOrder={[
                  ['otherField', 'asc'],
                  ['testField', 'desc'],
                ]}
              />
            </tr>
          </thead>
        </table>
      );
      fireEvent.click(screen.getByTestId('docTableHeaderFieldSort_testField'));
      expect(defaultProps.onChangeSortOrder).toHaveBeenCalledWith([['otherField', 'asc']]);
    });
  });
});
