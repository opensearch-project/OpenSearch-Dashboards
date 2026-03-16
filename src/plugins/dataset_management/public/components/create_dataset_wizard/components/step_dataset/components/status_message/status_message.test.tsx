/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
