/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';
import { IndexPatternField, DataView } from 'src/plugins/data/public';
import { IndexedFieldsTable } from './indexed_fields_table';
import { IndexedFieldItem } from './types';

jest.mock('@elastic/eui', () => ({
  EuiFlexGroup: 'eui-flex-group',
  EuiFlexItem: 'eui-flex-item',
  EuiIcon: 'eui-icon',
  EuiInMemoryTable: 'eui-in-memory-table',
}));

jest.mock('./components/table', () => ({
  // Note: this seems to fix React complaining about non lowercase attributes
  Table: () => {
    return 'table';
  },
}));

const helpers = {
  redirectToRoute: (field: IndexedFieldItem) => {},
  getFieldInfo: () => [],
};

const dataset = ({
  getNonScriptedFields: () => fields,
} as unknown) as DataView;

const mockFieldToIndexPatternField = (spec: Record<string, string | boolean | undefined>) => {
  return new IndexPatternField(
    (spec as unknown) as IndexPatternField['spec'],
    spec.displayName as string
  );
};

const fields = [
  {
    name: 'Elastic',
    displayName: 'Elastic',
    searchable: true,
    type: 'string',
  },
  { name: 'timestamp', displayName: 'timestamp', type: 'date' },
  { name: 'conflictingField', displayName: 'conflictingField', type: 'conflict' },
].map(mockFieldToIndexPatternField);

describe('IndexedFieldsTable', () => {
  test('should render normally', async () => {
    const component = shallow(
      <IndexedFieldsTable
        fields={fields}
        dataset={dataset}
        helpers={helpers}
        fieldWildcardMatcher={() => {
          return () => false;
        }}
        indexedFieldTypeFilter=""
        fieldFilter=""
      />
    );

    await new Promise((resolve) => process.nextTick(resolve));
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('should filter based on the query bar', async () => {
    const component = shallow(
      <IndexedFieldsTable
        fields={fields}
        dataset={dataset}
        helpers={helpers}
        fieldWildcardMatcher={() => {
          return () => false;
        }}
        indexedFieldTypeFilter=""
        fieldFilter=""
      />
    );

    await new Promise((resolve) => process.nextTick(resolve));
    component.setProps({ fieldFilter: 'Elast' });
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('should filter based on the type filter', async () => {
    const component = shallow(
      <IndexedFieldsTable
        fields={fields}
        dataset={dataset}
        helpers={helpers}
        fieldWildcardMatcher={() => {
          return () => false;
        }}
        indexedFieldTypeFilter=""
        fieldFilter=""
      />
    );

    await new Promise((resolve) => process.nextTick(resolve));
    component.setProps({ indexedFieldTypeFilter: 'date' });
    component.update();

    expect(component).toMatchSnapshot();
  });
});
