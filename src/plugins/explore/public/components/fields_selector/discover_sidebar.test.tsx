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
import { getStubIndexPattern } from '../../../../data/public/test_utils';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import * as fieldFilter from './lib/field_filter';

jest.mock('../../../opensearch_dashboards_services', () => ({
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
  getIndexPatternFieldList: jest.fn((indexPattern) => indexPattern.fields),
}));

function getCompProps(): DiscoverSidebarProps {
  const indexPattern = getStubIndexPattern(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  // @ts-expect-error _.each() is passing additional args to flattenHit
  const hits = _.each(_.cloneDeep(realHits), indexPattern.flattenHit) as Array<
    OpenSearchSearchHit<Record<string, any>>
  >;

  const fieldCounts: Record<string, number> = {};

  for (const hit of hits) {
    for (const key of Object.keys(indexPattern.flattenHit(hit))) {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
  }
  return {
    columns: ['extension'],
    fieldCounts,
    hits,
    onAddFilter: jest.fn(),
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    selectedIndexPattern: indexPattern,
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

  it('should have Selected and Discovered field sections', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    const fieldGroups = screen.getAllByTestId('dscSideBarFieldGroupButton');
    const allFields = screen.getAllByTestId('fieldList-field');

    expect(fieldGroups.length).toBeGreaterThanOrEqual(2);
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

  it('should allow selecting fields', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    fireEvent.click(screen.getByTestId('fieldToggle-bytes'));

    expect(props.onAddField).toHaveBeenCalledWith('bytes');
  });

  it('should allow adding filters and show multiple field instances', function () {
    const props = getCompProps();
    render(<DiscoverSidebar {...props} />);

    const showDetailsButtons = screen.getAllByTestId('field-extension-showDetails');
    expect(showDetailsButtons.length).toBeGreaterThanOrEqual(1);

    // Test clicking the first button works
    fireEvent.click(showDetailsButtons[0]);
    const plusButtons = screen.getAllByTestId('plus-extension-gif');
    fireEvent.click(plusButtons[0]);
    expect(props.onAddFilter).toHaveBeenCalled();

    // If there are multiple buttons, test the second one too
    if (showDetailsButtons.length > 1) {
      (props.onAddFilter as jest.Mock).mockClear();
      fireEvent.click(showDetailsButtons[1]);
      const updatedPlusButtons = screen.getAllByTestId('plus-extension-gif');
      fireEvent.click(updatedPlusButtons[1]);
      expect(props.onAddFilter).toHaveBeenCalled();
    }
  });
});
