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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent } from 'test_utils/testing_lib_helpers';
import { DiscoverField } from './discover_field';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { DataViewField } from '../../../../data/public';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';

jest.mock('../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getServices: () => ({
    history: () => ({
      location: {
        search: '',
      },
    }),
    capabilities: {
      visualize: {
        show: true,
      },
    },
    uiSettings: {
      get: (key: string) => {
        if (key === 'fields:popularLimit') {
          return 5;
        } else if (key === 'shortDots:enable') {
          return false;
        }
      },
    },
  }),
}));

function getProps({
  selected = false,
  showSummary = false,
  useShortDots = false,
  field,
}: {
  selected?: boolean;
  showSummary?: boolean;
  useShortDots?: boolean;
  field?: DataViewField;
}) {
  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  const finalField =
    field ??
    ({
      name: 'bytes',
      type: 'number',
      esTypes: ['long'],
      count: 10,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'bytes',
      filterable: true,
    } as DataViewField);

  const props = {
    dataSet,
    columns: [],
    field: finalField,
    getDetails: jest.fn(() => ({ buckets: [], error: '', exists: 1, total: 1 })),
    onAddFilter: jest.fn(),
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    showSummary,
    selected,
    useShortDots,
  };

  return props;
}

describe('discover sidebar field', function () {
  it('should allow selecting fields', async function () {
    const props = getProps({});
    render(<DiscoverField {...props} />);

    await fireEvent.click(screen.getByTestId('fieldToggle-bytes'));

    expect(props.onAddField).toHaveBeenCalledWith('bytes');
  });
  it('should allow deselecting fields', async function () {
    const props = getProps({ selected: true });
    render(<DiscoverField {...props} />);

    await fireEvent.click(screen.getByTestId('fieldToggle-bytes'));

    expect(props.onRemoveField).toHaveBeenCalledWith('bytes');
  });
  it('should trigger getDetails when showSummary is true', async function () {
    const props = getProps({ showSummary: true });
    render(<DiscoverField {...props} />);

    await fireEvent.click(screen.getByTestId('field-bytes-showDetails'));

    expect(props.getDetails).toHaveBeenCalledWith(props.field);
  });
  it('should not show details button when showSummary is false', function () {
    const props = getProps({ showSummary: false });
    render(<DiscoverField {...props} />);

    expect(screen.queryByTestId('field-bytes-showDetails')).toBeNull();
  });
  it('should not allow clicking on _source', function () {
    const field = {
      name: '_source',
      type: '_source',
      esTypes: ['_source'],
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: '_source',
      count: 0,
      scripted: false,
      filterable: false,
    } as DataViewField;
    const props = getProps({
      selected: true,
      field,
    });
    render(<DiscoverField {...props} />);

    expect(screen.queryByTestId('field-_source-showDetails')).toBeNull();
  });
});
