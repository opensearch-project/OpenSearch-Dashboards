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
  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    fields,
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
  fieldCounts['span.attributes.http@status_code'] = 5;

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

  afterEach(() => {
    if (spy) {
      spy.mockRestore(); // This works with spyOn
    }
  });

  it('should render the field header', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('should have Faceted, Selected and Discovered field sections', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check for field list sections (Selected, Query, Discovered)
    expect(screen.getByTestId('mocked-field-list-selected')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-field-list-discovered')).toBeInTheDocument();

    // Check that fields are rendered
    const allFields = screen.getAllByTestId('fieldList-field');
    expect(allFields.length).toBeGreaterThan(0);
  });

  it('should show all fields when missing filter is disabled', function () {
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
    expect(allFields.length).toBeGreaterThan(20);
  });

  it('should render the sidebar structure with all field sections', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check that the main sections are present
    expect(screen.getByTestId('mocked-field-list-selected')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-field-list-discovered')).toBeInTheDocument();

    // Check that field search is present
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should call onCollapse when header collapse button is clicked', function () {
    const props = { ...getCompProps(), onCollapse: jest.fn() };
    render(<DiscoverSidebar {...props} />);

    const collapseButton = screen.getByTestId('fieldList-collapse-button');
    fireEvent.click(collapseButton);
    expect(props.onCollapse).toHaveBeenCalled();
  });

  it('should render field search functionality', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check that field search input exists
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    // Check that filter toggle button exists
    expect(screen.getByTestId('toggleFieldFilterButton')).toBeInTheDocument();
  });

  it('should render proper sections structure', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check that sections are rendered properly
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Discovered')).toBeInTheDocument();

    // Check that fields are displayed in the mocked components
    const fieldItems = screen.getAllByTestId('fieldList-field');
    expect(fieldItems.length).toBeGreaterThan(0);
  });
});
