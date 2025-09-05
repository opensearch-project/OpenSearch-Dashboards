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
    core: {
      application: {
        currentAppId$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      },
    },
  }),
}));

jest.mock('./lib/get_index_pattern_field_list', () => ({
  getIndexPatternFieldList: jest.fn((dataSet) => dataSet.fields),
}));

jest.mock('../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => null),
}));

import { useFlavorId } from '../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../common';
const mockUseFlavorId = useFlavorId as jest.MockedFunction<typeof useFlavorId>;

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

  // Ensure serviceName field exists for faceted field tests
  if (!fields.find((f: any) => f.name === 'serviceName')) {
    fields.push({
      name: 'serviceName',
      type: 'string',
      esTypes: ['keyword'],
      count: 0,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'Service Name',
    });
  }

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
    // Reset the useFlavorId mock to default
    mockUseFlavorId.mockReturnValue(null);
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

  it('should render faceted fields when they exist', function () {
    spy = jest.spyOn(fieldFilter, 'getDefaultFieldFilter').mockReturnValue({
      missing: false,
      type: 'any',
      name: '',
      aggregatable: null,
      searchable: null,
    });

    // Mock flavor to be 'traces' so faceted fields are shown
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);

    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check that faceted fields section is rendered
    expect(screen.getByTestId('mocked-facet-list')).toBeInTheDocument();
    expect(screen.getByText('Faceted fields')).toBeInTheDocument();

    // Check that default faceted fields are present
    const facetedFields = screen.getAllByTestId('facetList-field');
    expect(facetedFields.length).toBeGreaterThan(0);
  });

  it('should render additional faceted fields from DataView', function () {
    spy = jest.spyOn(fieldFilter, 'getDefaultFieldFilter').mockReturnValue({
      missing: false,
      type: 'any',
      name: '',
      aggregatable: null,
      searchable: null,
    });

    // Mock flavor to be 'traces' so faceted fields are shown
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);

    // Create a custom data set with additional faceted fields
    const customFields = stubbedLogstashFields();

    // Add custom fields that we'll mark as faceted
    customFields.push({
      name: 'custom.faceted.field1',
      type: 'string',
      esTypes: ['keyword'],
      count: 0,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'Custom Faceted Field 1',
    });

    customFields.push({
      name: 'custom.faceted.field2',
      type: 'string',
      esTypes: ['keyword'],
      count: 0,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'Custom Faceted Field 2',
    });

    const props = getCompProps(customFields);

    // Add additional faceted fields to the data set
    props.selectedDataSet!.facetedFields = ['custom.faceted.field1', 'custom.faceted.field2'];

    // Add field counts for our custom faceted fields
    props.fieldCounts['custom.faceted.field1'] = 5;
    props.fieldCounts['custom.faceted.field2'] = 3;

    render(<DiscoverSidebar {...props} />);

    // Check that faceted fields section is rendered
    expect(screen.getByTestId('mocked-facet-list')).toBeInTheDocument();
    expect(screen.getByText('Faceted fields')).toBeInTheDocument();

    // Check that our custom faceted fields are present
    const facetedFieldElements = screen.getAllByTestId('facetList-field');
    const facetedFieldNames = facetedFieldElements.map((el) => el.textContent);

    // Should include both default and custom faceted fields
    expect(facetedFieldNames).toContain('serviceName'); // Default faceted field
    expect(facetedFieldNames).toContain('custom.faceted.field1'); // Custom faceted field
    expect(facetedFieldNames).toContain('custom.faceted.field2'); // Custom faceted field
  });

  it('should handle undefined faceted fields gracefully', function () {
    spy = jest.spyOn(fieldFilter, 'getDefaultFieldFilter').mockReturnValue({
      missing: false,
      type: 'any',
      name: '',
      aggregatable: null,
      searchable: null,
    });

    // Mock flavor to be 'traces' so faceted fields are shown
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);

    const props = getCompProps();

    // Explicitly set facetedFields to undefined
    props.selectedDataSet!.facetedFields = undefined;

    render(<DiscoverSidebar {...props} />);

    // Should still render faceted fields section with only default faceted fields
    expect(screen.getByTestId('mocked-facet-list')).toBeInTheDocument();
    expect(screen.getByText('Faceted fields')).toBeInTheDocument();

    // Should only show default faceted fields (serviceName should be present)
    const facetedFields = screen.getAllByTestId('facetList-field');
    expect(facetedFields.length).toBeGreaterThan(0);

    const facetedFieldNames = facetedFields.map((el) => el.textContent);
    expect(facetedFieldNames).toContain('serviceName');
  });

  it('should not render faceted fields in non-traces flavor', function () {
    spy = jest.spyOn(fieldFilter, 'getDefaultFieldFilter').mockReturnValue({
      missing: false,
      type: 'any',
      name: '',
      aggregatable: null,
      searchable: null,
    });

    // Mock flavor to be null so faceted fields are NOT shown
    mockUseFlavorId.mockReturnValue(null);

    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    // Check that faceted fields section is NOT rendered
    expect(screen.queryByTestId('mocked-facet-list')).not.toBeInTheDocument();
    expect(screen.queryByText('Faceted fields')).not.toBeInTheDocument();

    // Should still have other sections
    expect(screen.getByTestId('mocked-field-list-selected')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-field-list-discovered')).toBeInTheDocument();
  });
});
