/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import type { ComponentStory } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { indexPatternMock } from '../../../../discover/public';
import { DocViewer } from './doc_viewer';
import { DocViewRenderProps, DocViewsRegistry } from '../../types/doc_views_types';
import { DocViewTable } from './doc_viewer_table/table';
import { JsonCodeBlock } from './json_code_block/json_code_block';

export default {
  component: DocViewer,
  title: 'src/plugins/explore/public/components/doc_viewer/doc_viewer',
};

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

const Template: ComponentStory<typeof DocViewer> = (args) => (
  <DocViewer {...args} docViewsRegistry={docViewsRegistry} />
);

export const Primary = Template.bind({});

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
  filter: () => {},
  onAddColumn: () => {
    action(`Clicked for AddColumn`);
  },
  onRemoveColumn: () => {
    action(`Clicked for RemoveColumn`);
  },
};

Primary.args = {
  renderProps: mockRenderProps,
};
