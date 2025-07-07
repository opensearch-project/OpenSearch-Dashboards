/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { EuiButtonEmpty } from '@elastic/eui';
import { RenderCustomDataGrid } from './custom_datagrid';

// Import the SCSS file that defines the necessary EUI variables and imports the original SCSS
import './custom_datagrid.stories.scss';

export default {
  component: RenderCustomDataGrid,
  title:
    'src/plugins/explore/public/application/pages/traces/trace_details/public/utils/custom_datagrid',
} as ComponentMeta<typeof RenderCustomDataGrid>;

const Template: ComponentStory<typeof RenderCustomDataGrid> = (args) => (
  <RenderCustomDataGrid {...args} />
);

export const Primary = Template.bind({});

// Mock columns for the data grid
const mockColumns = [
  { id: 'id', display: 'ID', width: 100 },
  { id: 'name', display: 'Name', width: 150 },
  { id: 'value', display: 'Value', width: 150 },
  { id: 'attributes.hidden', display: 'Hidden Column', width: 150 },
];

// Mock render cell value function
const mockRenderCellValue = ({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
  if (columnId === 'id') return `ID-${rowIndex + 1}`;
  if (columnId === 'name') return `Item ${rowIndex + 1}`;
  if (columnId === 'value') return `Value ${rowIndex + 1}`;
  if (columnId === 'attributes.hidden') return `Hidden ${rowIndex + 1}`;
  return `${columnId}-${rowIndex}`;
};

Primary.args = {
  columns: mockColumns,
  renderCellValue: mockRenderCellValue,
  rowCount: 10,
};

// Loading state variant
export const Loading = Template.bind({});
Loading.args = {
  ...Primary.args,
  isTableDataLoading: true,
  rowCount: 20,
};

// Loading state with empty data
export const LoadingEmpty = Template.bind({});
LoadingEmpty.args = {
  ...Primary.args,
  isTableDataLoading: true,
  rowCount: 0,
};

// Empty state variant
export const Empty = Template.bind({});
Empty.args = {
  ...Primary.args,
  rowCount: 0,
};

export const WithPagination = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const handleChangePage = (newPage: number) => {
    setPageIndex(newPage);
    action('Page changed')(newPage);
  };

  const handleChangeItemsPerPage = (newSize: number) => {
    setPageSize(newSize);
    action('Items per page changed')(newSize);
  };

  return (
    <RenderCustomDataGrid
      columns={mockColumns}
      renderCellValue={mockRenderCellValue}
      rowCount={100}
      pagination={{
        pageIndex,
        pageSize,
        pageSizeOptions: [5, 10, 20, 50],
        onChangePage: handleChangePage,
        onChangeItemsPerPage: handleChangeItemsPerPage,
      }}
    />
  );
};

// With sorting functionality - using a functional component to handle state
export const WithSorting = () => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (columns: Array<{ id: string; direction: 'asc' | 'desc' }>) => {
    if (columns.length > 0) {
      setSortDirection(columns[0].direction);
    }
    action('Sort changed')(columns);
  };

  // Create a sorted array of indices based on the current sort direction
  const getRowIndex = (index: number) => {
    // For ascending order, use the original index
    if (sortDirection === 'asc') {
      return index;
    }
    // For descending order, reverse the order
    else {
      return 19 - index; // Using 20 rows total (0-19)
    }
  };

  // Sort the mock data based on the current sort direction
  const sortedRenderCellValue = ({
    rowIndex,
    columnId,
  }: {
    rowIndex: number;
    columnId: string;
  }) => {
    // Apply the sorting to all columns by using the sorted index
    const sortedIndex = getRowIndex(rowIndex);

    if (columnId === 'id') return `ID-${sortedIndex + 1}`;
    if (columnId === 'name') return `Item ${sortedIndex + 1}`;
    if (columnId === 'value') return `Value ${sortedIndex + 1}`;
    if (columnId === 'attributes.hidden') return `Hidden ${sortedIndex + 1}`;
    return `${columnId}-${sortedIndex}`;
  };

  return (
    <RenderCustomDataGrid
      columns={mockColumns}
      renderCellValue={sortedRenderCellValue}
      rowCount={20}
      sorting={{
        columns: [
          {
            id: 'name',
            direction: sortDirection,
          },
        ],
        onSort: handleSort,
      }}
    />
  );
};

// Full screen variant - Note: This will show the initial state with fullScreen=true,
// but the actual full screen behavior requires user interaction with the button
export const FullScreen = Template.bind({});
FullScreen.args = {
  ...Primary.args,
  fullScreen: true,
  defaultHeight: '400px', // Set a specific height to better demonstrate the full screen effect
};

// With custom width variant
export const CustomWidth = Template.bind({});
CustomWidth.args = {
  ...Primary.args,
  availableWidth: 800,
};

// With toolbar buttons variant using EUI buttons
export const WithToolbarButtons = Template.bind({});
WithToolbarButtons.args = {
  ...Primary.args,
  toolbarButtons: [
    <EuiButtonEmpty key="button1" size="s" color="text" onClick={action('Button 1 clicked')}>
      Button 1
    </EuiButtonEmpty>,
    <EuiButtonEmpty key="button2" size="s" color="text" onClick={action('Button 2 clicked')}>
      Button 2
    </EuiButtonEmpty>,
  ],
};
