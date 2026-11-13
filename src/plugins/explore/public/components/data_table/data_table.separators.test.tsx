/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { DataTable } from './data_table';
import { DocViewsRegistry } from '../../types/doc_views_types';
import { indexPatternMock } from '../../__mock__/index_pattern_mock';
import { mockColumns, mockRows } from './data_table.mocks';

describe('DataTable row separators', () => {
  beforeEach(() => {
    window.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    }));
  });

  const renderTable = (showRowSeparators?: boolean) =>
    render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <DataTable
          columns={mockColumns}
          rows={mockRows}
          dataset={indexPatternMock}
          sampleSize={mockRows.length}
          isShortDots={false}
          docViewsRegistry={new DocViewsRegistry()}
          onFilter={jest.fn()}
          showRowSeparators={showRowSeparators}
        />
      </IntlProvider>
    );

  it('draws no separators by default', () => {
    renderTable();
    expect(screen.getByTestId('docTable')).not.toHaveClass('explore-table--separators');
  });

  it('draws separators when showRowSeparators is set', () => {
    renderTable(true);
    expect(screen.getByTestId('docTable')).toHaveClass('explore-table--separators');
  });
});
