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
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { ROW_SEPARATORS_SETTING } from '../../../common';

describe('DataTable row separators', () => {
  beforeEach(() => {
    window.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    }));
  });

  const table = (
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
      />
    </IntlProvider>
  );

  const renderWithSettings = (settings: Record<string, unknown>) =>
    render(
      <OpenSearchDashboardsContextProvider
        services={{
          uiSettings: { get: (key: string, fallback: unknown) => settings[key] ?? fallback },
        }}
      >
        {table}
      </OpenSearchDashboardsContextProvider>
    );

  it('draws no separators by default, also without OpenSearch Dashboards services', () => {
    render(table);
    expect(screen.getByTestId('docTable')).not.toHaveClass('explore-table--separators');
  });

  it('draws no separators when the setting is off', () => {
    renderWithSettings({});
    expect(screen.getByTestId('docTable')).not.toHaveClass('explore-table--separators');
  });

  it('draws separators when explore:rowSeparators is on', () => {
    renderWithSettings({ [ROW_SEPARATORS_SETTING]: true });
    expect(screen.getByTestId('docTable')).toHaveClass('explore-table--separators');
  });
});
