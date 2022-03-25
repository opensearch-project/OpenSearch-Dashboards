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
import { StatusMessage } from '../status_message';
import { shallow } from 'enzyme';
import { MatchedItem } from '../../../../types';

const tagsPartial = {
  tags: [],
};

const matchedIndices = {
  allIndices: ([
    { name: 'opensearch-dashboards', ...tagsPartial },
    { name: 'opensearch', ...tagsPartial },
  ] as unknown) as MatchedItem[],
  exactMatchedIndices: [] as MatchedItem[],
  partialMatchedIndices: ([
    { name: 'opensearch-dashboards', ...tagsPartial },
  ] as unknown) as MatchedItem[],
};

describe('StatusMessage', () => {
  it('should render without a query', () => {
    const component = shallow(
      <StatusMessage
        matchedIndices={matchedIndices}
        query={''}
        isIncludingSystemIndices={false}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render with exact matches', () => {
    const localMatchedIndices = {
      ...matchedIndices,
      exactMatchedIndices: ([
        { name: 'opensearch-dashboards', ...tagsPartial },
      ] as unknown) as MatchedItem[],
    };

    const component = shallow(
      <StatusMessage
        matchedIndices={localMatchedIndices}
        query={'o*'}
        isIncludingSystemIndices={false}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render with partial matches', () => {
    const component = shallow(
      <StatusMessage
        matchedIndices={matchedIndices}
        query={'o'}
        isIncludingSystemIndices={false}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render with no partial matches', () => {
    const localMatchedIndices = {
      ...matchedIndices,
      partialMatchedIndices: [],
    };

    const component = shallow(
      <StatusMessage
        matchedIndices={localMatchedIndices}
        query={'o'}
        isIncludingSystemIndices={false}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should show that system indices exist', () => {
    const component = shallow(
      <StatusMessage
        matchedIndices={{
          allIndices: [],
          exactMatchedIndices: [],
          partialMatchedIndices: [],
        }}
        isIncludingSystemIndices={false}
        query={''}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should show that no indices exist', () => {
    const component = shallow(
      <StatusMessage
        matchedIndices={{
          allIndices: [],
          exactMatchedIndices: [],
          partialMatchedIndices: [],
        }}
        isIncludingSystemIndices={true}
        query={''}
        showSystemIndices={false}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
