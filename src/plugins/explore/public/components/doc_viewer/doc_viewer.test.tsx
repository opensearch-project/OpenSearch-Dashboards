/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { indexPatternMock } from 'src/plugins/discover/public';
import { DocViewRenderProps, DocViewsRegistry } from '../../types/doc_views_types';
import { DocViewer } from './doc_viewer';
import { DocViewTable } from './doc_viewer_table/table';
import { JsonCodeBlock } from './json_code_block/json_code_block';

describe('DocViewer', () => {
  const mockFilter = jest.fn();
  const mockOnAddColumn = jest.fn();
  const mockOnRemoveColumn = jest.fn();
  const mockRenderProps: DocViewRenderProps = {
    hit: {
      _index: 'data_logs_small_time_1',
      _id: 'N9srQ8opwBxGdIoQU3TW',
      _version: 1,
      _score: 100,
      _type: '_doc',
      _source: {
        category: 'Application',
        unique_category: 'Maintenance',
        status_code: 500,
        response_time: 3.65,
        bytes_transferred: 9268,
        event_sequence_number: '1738569033798964700n',
        request_url: 'http://blond-winner.biz',
        service_endpoint: '/api/v3/products',
        personal: {
          user_id: '3e49abcf-18af-4f5d-b72c-a0fe6c118154',
          name: 'Nina Botsford MD',
          age: 32,
          email: 'Demarcus.Hyatt16@yahoo.com',
          address: {
            street: '251 Janessa Point',
            city: 'Montreal',
            country: 'Canada',
            coordinates: '{lat: 45.5017, lon: -73.5673}',
          },
          birthdate: '1946-08-03T23:21:55.763Z',
        },
        timestamp: '2022-12-31T22:14:42.801Z',
        event_time: '2022-12-31T08:14:42.801Z',
      },
      fields: {
        event_time: ['2022-12-31T08:14:42.801Z'],
        timestamp: ['2022-12-31T22:14:42.801Z'],
      },
      sort: ['1672524882801'],
    },
    columns: ['timestamp', '_source'],
    indexPattern: indexPatternMock,
    filter: mockFilter,
    onAddColumn: mockOnAddColumn,
    onRemoveColumn: mockOnRemoveColumn,
  };

  it('render empty if docViewsRegistry is empty', () => {
    const docViewsRegistry = new DocViewsRegistry();
    render(<DocViewer renderProps={mockRenderProps} docViewsRegistry={docViewsRegistry} />);

    const osdDocViewer = screen.queryByTestId('osdDocViewer');
    expect(osdDocViewer).not.toBeInTheDocument();
  });

  it('render tab content', async () => {
    const docViewsRegistry = new DocViewsRegistry();
    docViewsRegistry.addDocView({
      title: i18n.translate('explore.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });
    docViewsRegistry.addDocView({
      title: i18n.translate('explore.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });

    const user = userEvent.setup();

    render(<DocViewer renderProps={mockRenderProps} docViewsRegistry={docViewsRegistry} />);

    const osdDocViewer = screen.queryByTestId('osdDocViewer');
    expect(osdDocViewer).toBeInTheDocument();

    const osdDocViewerTable = screen.queryByTestId('osdDocViewerTable');
    expect(osdDocViewerTable).toBeInTheDocument();

    // switch tabs
    await user.click(screen.getByRole('tab', { selected: false }));

    const osdJsonCodeBlock = screen.queryByTestId('osdJsonCodeBlock');
    expect(osdJsonCodeBlock).toBeInTheDocument();
  });
});
