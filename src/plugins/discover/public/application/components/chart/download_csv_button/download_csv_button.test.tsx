/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
// @ts-ignore
import { saveAs } from '@elastic/filesaver';
import moment from 'moment';
import { fireEvent, render, screen } from '@testing-library/react';
import { stubIndexPatternWithFields } from '../../../../../../data/common/index_patterns/index_pattern.stub';
import { DownloadCsvButton, selectColumnNames } from './download_csv_button';
import { discoverPluginMock } from '../../../../mocks';
import { setServices } from '../../../../opensearch_dashboards_services';
import { useSelector } from '../../../utils/state_management';

jest.mock('../../../utils/state_management', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@elastic/filesaver', () => ({
  saveAs: jest.fn(),
}));

const sourceOnlyColumns = ['_source'];
const nonSourceColumns = ['personal.address'];

const mockIndexPattern = {
  id: '41e84710-e421-11ef-a607-29d861e27fe9',
  title: 'data_logs_small_time_*',
  fieldFormatMap: {},
  getFieldByName: (column: string) => column,
  fields: [
    {
      count: 0,
      name: '_id',
      type: 'string',
      esTypes: ['_id'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
    },
    {
      count: 0,
      name: '_index',
      type: 'string',
      esTypes: ['_index'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
    },
    {
      count: 0,
      name: '_score',
      type: 'number',
      scripted: false,
      searchable: false,
      aggregatable: false,
      readFromDocValues: false,
    },
    {
      count: 0,
      name: '_source',
      type: '_source',
      esTypes: ['_source'],
      scripted: false,
      searchable: false,
      aggregatable: false,
      readFromDocValues: false,
    },
    {
      count: 0,
      name: '_type',
      type: 'string',
      scripted: false,
      searchable: false,
      aggregatable: false,
      readFromDocValues: false,
    },
    {
      count: 0,
      name: 'personal.address',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
    },
    {
      count: 0,
      name: 'timestamp',
      type: 'date',
      esTypes: ['date'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
    },
  ],
  timeFieldName: 'timestamp',
  metaFields: ['_source', '_id', '_type', '_index', '_score'],
  version: 'WzI0ODYsNV0=',
  dataSourceRef: {
    id: '3b213360-e421-11ef-a607-29d861e27fe9',
    type: 'data-source',
    name: 'dataSource',
  },
  originalSavedObjectBody: {
    title: 'data_logs_small_time_*',
    timeFieldName: 'timestamp',
    fields:
      '[{"count":0,"name":"_id","type":"string","esTypes":["_id"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_index","type":"string","esTypes":["_index"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_score","type":"number","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_source","type":"_source","esTypes":["_source"],"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_type","type":"string","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"bytes_transferred","type":"number","esTypes":["long"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"category","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_sequence_number","type":"number","esTypes":["long"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_time","type":"date","esTypes":["date"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"never_present_field","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"personal.address.city","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal.address"}}},{"count":0,"name":"personal.address.coordinates.lat","type":"number","esTypes":["float"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal.address.coordinates"}}},{"count":0,"name":"personal.address.coordinates.lon","type":"number","esTypes":["float"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal.address.coordinates"}}},{"count":0,"name":"personal.address.country","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal.address"}}},{"count":0,"name":"personal.address.street","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal.address"}}},{"count":0,"name":"personal.age","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal"}}},{"count":0,"name":"personal.birthdate","type":"date","esTypes":["date"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal"}}},{"count":0,"name":"personal.email","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal"}}},{"count":0,"name":"personal.name","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal"}}},{"count":0,"name":"personal.user_id","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"nested":{"path":"personal"}}},{"count":0,"name":"request_url","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"response_time","type":"number","esTypes":["float"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"service_endpoint","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"status_code","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"timestamp","type":"date","esTypes":["date"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"unique_category","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
  },
  shortDotsEnable: false,
  fieldFormats: {
    fieldFormats: {},
    defaultMap: {
      ip: {
        id: 'ip',
        params: {},
      },
      date: {
        id: 'date',
        params: {},
      },
      date_nanos: {
        id: 'date_nanos',
        params: {},
        opensearch: true,
      },
      number: {
        id: 'number',
        params: {},
      },
      boolean: {
        id: 'boolean',
        params: {},
      },
      _source: {
        id: '_source',
        params: {},
      },
      _default_: {
        id: 'string',
        params: {},
      },
    },
    metaParamsOptions: {
      parsedUrl: {
        origin: 'http://localhost:5601',
        pathname: '/w/IiYSxk/app/data-explorer/discover',
        basePath: '/w/IiYSxk',
      },
    },
  },
};

describe('Download CSV Button', () => {
  beforeAll(() => {
    setServices(discoverPluginMock.createDiscoverServicesMock());
  });

  describe('selectColumnNames', () => {
    it('Returns columns correctly when there are state columns, has _source, !hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: false,
      })({ discover: { columns: sourceOnlyColumns } } as any);

      expect(result).toEqual(['timestamp', ...sourceOnlyColumns]);
    });

    it('Returns columns correctly when there are state columns, has non _source-columns, !hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: false,
      })({ discover: { columns: nonSourceColumns } } as any);

      expect(result).toEqual(['timestamp', ...nonSourceColumns]);
    });

    it('Returns columns correctly when there are state columns, has _source, hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: true,
      })({ discover: { columns: sourceOnlyColumns } } as any);

      expect(result).toEqual(sourceOnlyColumns);
    });

    it('Returns columns correctly when there are state columns, has non _source-columns, hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: true,
      })({ discover: { columns: nonSourceColumns } } as any);

      expect(result).toEqual(nonSourceColumns);
    });

    it('Returns columns correctly when there are no state columns, !hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: false,
      })({ discover: { columns: [] } } as any);

      expect(result).toEqual(['timestamp', ...sourceOnlyColumns]);
    });

    it('Returns columns correctly when there are no state columns, hideTimeColumn', () => {
      const result = selectColumnNames({
        indexPattern: mockIndexPattern as any,
        isShortDots: false,
        hideTimeColumn: true,
      })({ discover: { columns: [] } } as any);

      expect(result).toEqual(sourceOnlyColumns);
    });
  });

  // TODO: This function is difficult to test as we need a proper index pattern mock
  describe.skip('formatRowsForCsv', () => {
    it('correctly formats rows', () => {});
  });

  it('Renders the text correctly for multiple rows', () => {
    (useSelector as jest.MockedFunction<any>).mockImplementationOnce(() => ['response']);
    render(<DownloadCsvButton indexPattern={stubIndexPatternWithFields} rows={[{}, {}] as any} />);
    expect(screen.getByText('Download 2 documents as CSV')).toBeInTheDocument();
  });

  it('Renders the text correctly for single row', () => {
    (useSelector as jest.MockedFunction<any>).mockImplementationOnce(() => ['response']);
    render(<DownloadCsvButton indexPattern={stubIndexPatternWithFields} rows={[{}] as any} />);
    expect(screen.getByText('Download 1 document as CSV')).toBeInTheDocument();
  });

  // TODO: Once we have proper mocks for index patterns, update this test and enable it
  it.skip('clicking on button downloads file', () => {
    (useSelector as jest.MockedFunction<any>).mockImplementationOnce(() => ['response']);
    render(<DownloadCsvButton indexPattern={stubIndexPatternWithFields} rows={[{}] as any} />);
    fireEvent.click(screen.getByText('Download 1 document as CSV'));
    expect(saveAs).toHaveBeenCalledWith(
      expect.anything(),
      `opensearch_export-${moment()}.format('YYYY-MM-DD')`
    );
  });
});
