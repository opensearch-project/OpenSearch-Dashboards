/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { TableRow } from './table_row';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { getStubIndexPattern } from '../../../../../../../../data/public/test_utils';

jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: jest.fn().mockReturnValue({ uiSettings: { get: jest.fn() } }),
}));

describe('TableRow: the _source column', () => {
  const row = { _id: '1', _source: { service: 'orders', status: 200 } } as OpenSearchSearchHit;

  const renderRow = (fields: Array<{ name: string; type: string }>) => {
    const indexPattern = getStubIndexPattern(
      'logs',
      (cfg) => cfg,
      null,
      fields,
      coreMock.createSetup()
    );
    return render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <table>
          <tbody>
            <TableRow row={row} columns={['_source']} indexPattern={indexPattern} isShortDots />
          </tbody>
        </table>
      </IntlProvider>
    );
  };

  const fieldTitles = () =>
    screen.queryAllByTestId('dscDataGridTableCellListFieldTitle').map((e) => e.textContent);

  it('shows each field when the index pattern lists _source', () => {
    renderRow([
      { name: '_source', type: '_source' },
      { name: 'service', type: 'string' },
      { name: 'status', type: 'number' },
    ]);
    expect(fieldTitles()).toEqual(expect.arrayContaining(['service:', 'status:']));
  });

  it("shows each field when the dataset doesn't list _source", () => {
    // A data-frame dataset, or an index pattern with _source removed from the metaFields setting.
    renderRow([
      { name: 'service', type: 'string' },
      { name: 'status', type: 'number' },
    ]);
    expect(fieldTitles()).toEqual(expect.arrayContaining(['service:', 'status:']));
  });
});
