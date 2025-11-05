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

import _ from 'lodash';
// @ts-ignore
import realHits from 'fixtures/real_hits.js';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiscoverSidebar, DiscoverSidebarProps } from './discover_sidebar';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import * as fieldFilter from './lib/field_filter';
import { ExploreFlavor } from '../../../common';
import * as useFlavorIdModule from '../../helpers/use_flavor_id';

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
      discover: {
        save: false,
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

jest.mock('../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(),
}));

jest.mock('./lib/get_index_pattern_field_list', () => ({
  getIndexPatternFieldList: jest.fn((dataSet) => dataSet.fields),
}));

jest.mock('./field_list', () => ({
  FieldList: ({ title, fields, category }: { title: string; fields: any[]; category: string }) => (
    <div data-test-subj={`mocked-field-list-${category}`}>
      <h3>{title}</h3>
      {fields.map((field, index) => (
        <div key={index} data-test-subj="fieldList-field">
          {field.name}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./facet_list', () => ({
  FacetList: ({ title, fields }: { title: string; fields: any[] }) => (
    <div data-test-subj="mocked-facet-list">
      <h3>{title}</h3>
      {fields.map((field, index) => (
        <div key={index} data-test-subj="facetList-field">
          {field.name}
        </div>
      ))}
    </div>
  ),
}));

function getCompProps(customFields?: any[]): DiscoverSidebarProps {
  const fields = customFields || stubbedLogstashFields();

  // Add faceted fields to the field list
  const facetedFields = [
    {
      name: 'serviceName',
      type: 'string',
      esTypes: ['keyword'],
      count: 0,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'Service Name',
    },
    {
      name: 'status.code',
      type: 'number',
      esTypes: ['long'],
      count: 0,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'Status Code',
    },
  ];

  const allFields = [...fields, ...facetedFields];

  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    allFields,
    coreMock.createSetup()
  );

  // @ts-expect-error _.each() is passing additional args to flattenHit
  const hits = _.each(_.cloneDeep(realHits), dataSet.flattenHit) as Array<
    OpenSearchSearchHit<Record<string, any>>
  >;

  const fieldCounts: Record<string, number> = {};

  for (const hit of hits) {
    for (const key of Object.keys(dataSet.flattenHit(hit))) {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
  }

  // Add some mock faceted field counts
  fieldCounts.serviceName = 10;
  fieldCounts['status.code'] = 8;

  return {
    columns: ['extension'],
    fieldCounts,
    hits,
    onAddFilter: jest.fn(),
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    selectedDataSet: dataSet,
    onReorderFields: jest.fn(),
    isEnhancementsEnabledOverride: false,
  };
}

describe('discover sidebar', function () {
  let spy: jest.SpyInstance;
  const mockUseFlavorId = useFlavorIdModule.useFlavorId as jest.MockedFunction<
    typeof useFlavorIdModule.useFlavorId
  >;

  beforeEach(() => {
    mockUseFlavorId.mockReturnValue(null);
  });

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
    jest.clearAllMocks();
  });

  it('should render basic field sections', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    expect(screen.getByTestId('mocked-field-list-selected')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-field-list-discovered')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should show faceted fields when flavor is Traces', function () {
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    expect(screen.getByTestId('mocked-facet-list')).toBeInTheDocument();
    expect(screen.getByText('Faceted fields')).toBeInTheDocument();
  });

  it('should not show faceted fields when flavor is not Traces', function () {
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Logs);
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    expect(screen.queryByTestId('mocked-facet-list')).not.toBeInTheDocument();
  });

  it('should call onCollapse when provided', function () {
    const props = { ...getCompProps(), onCollapse: jest.fn() };
    render(<DiscoverSidebar {...props} />);

    const collapseButton = screen.getByTestId('fieldList-collapse-button');
    fireEvent.click(collapseButton);
    expect(props.onCollapse).toHaveBeenCalled();
  });

  it('should render fields in appropriate sections', function () {
    spy = jest.spyOn(fieldFilter, 'getDefaultFieldFilter').mockReturnValue({
      missing: false,
      type: 'any',
      name: '',
      aggregatable: null,
      searchable: null,
    });
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    const allFields = screen.getAllByTestId('fieldList-field');
    expect(allFields.length).toBeGreaterThan(0);
  });
});
