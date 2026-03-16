/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { SourceFiltersTable } from './source_filters_table';
import { DataView } from 'src/plugins/data/public';

jest.mock('@elastic/eui', () => ({
  EuiButton: 'eui-button',
  EuiTitle: 'eui-title',
  EuiText: 'eui-text',
  EuiHorizontalRule: 'eui-horizontal-rule',
  EuiSpacer: 'eui-spacer',
  EuiCallOut: 'eui-call-out',
  EuiLink: 'eui-link',
  EuiOverlayMask: 'eui-overlay-mask',
  EuiConfirmModal: 'eui-confirm-modal',
  EuiLoadingSpinner: 'eui-loading-spinner',
  Comparators: {
    property: () => {},
    default: () => {},
  },
}));

jest.mock('./components/header', () => ({ Header: 'header' }));
jest.mock('./components/table', () => ({
  // Note: this seems to fix React complaining about non lowercase attributes
  Table: () => {
    return 'table';
  },
}));

const getDatasetMock = (mockedFields: any = {}) =>
  ({
    sourceFilters: [{ value: 'time*' }, { value: 'nam*' }, { value: 'age*' }],
    ...mockedFields,
  } as DataView);

describe('SourceFiltersTable', () => {
  test('should render normally', () => {
    const component = shallow(
      <SourceFiltersTable
        dataset={getDatasetMock()}
        fieldWildcardMatcher={() => {}}
        filterFilter={''}
        saveDataset={async () => {}}
        useUpdatedUX={false}
      />
    );

    expect(component).toMatchSnapshot();
  });

  test('should filter based on the query bar', () => {
    const component = shallow(
      <SourceFiltersTable
        dataset={getDatasetMock()}
        fieldWildcardMatcher={() => {}}
        filterFilter={''}
        saveDataset={async () => {}}
        useUpdatedUX={false}
      />
    );

    component.setProps({ filterFilter: 'ti' });
    expect(component).toMatchSnapshot();
  });

  test('should should a loading indicator when saving', () => {
    const component = shallow(
      <SourceFiltersTable
        dataset={getDatasetMock({
          sourceFilters: [{ value: 'tim*' }],
        })}
        filterFilter={''}
        fieldWildcardMatcher={() => {}}
        saveDataset={async () => {}}
        useUpdatedUX={false}
      />
    );

    component.setState({ isSaving: true });
    expect(component).toMatchSnapshot();
  });

  test('should show a delete modal', () => {
    const component = shallow<SourceFiltersTable>(
      <SourceFiltersTable
        dataset={
          getDatasetMock({
            sourceFilters: [{ value: 'tim*' }],
          }) as DataView
        }
        filterFilter={''}
        fieldWildcardMatcher={() => {}}
        saveDataset={async () => {}}
        useUpdatedUX={false}
      />
    );

    component.instance().startDeleteFilter({ value: 'tim*', clientId: 1 });
    component.update(); // We are not calling `.setState` directly so we need to re-render
    expect(component).toMatchSnapshot();
  });

  test('should remove a filter', async () => {
    const saveDataset = jest.fn(async () => {});
    const component = shallow<SourceFiltersTable>(
      <SourceFiltersTable
        dataset={
          getDatasetMock({
            sourceFilters: [{ value: 'tim*' }, { value: 'na*' }],
          }) as DataView
        }
        filterFilter={''}
        fieldWildcardMatcher={() => {}}
        saveDataset={saveDataset}
        useUpdatedUX={false}
      />
    );

    component.instance().startDeleteFilter({ value: 'tim*', clientId: 1 });
    component.update(); // We are not calling `.setState` directly so we need to re-render
    await component.instance().deleteFilter();
    component.update(); // We are not calling `.setState` directly so we need to re-render

    expect(saveDataset).toBeCalled();
    expect(component).toMatchSnapshot();
  });

  test('should add a filter', async () => {
    const saveDataset = jest.fn(async () => {});
    const component = shallow<SourceFiltersTable>(
      <SourceFiltersTable
        dataset={getDatasetMock({
          sourceFilters: [{ value: 'tim*' }],
        })}
        filterFilter={''}
        fieldWildcardMatcher={() => {}}
        saveDataset={saveDataset}
        useUpdatedUX={false}
      />
    );

    await component.instance().onAddFilter('na*');
    component.update(); // We are not calling `.setState` directly so we need to re-render

    expect(saveDataset).toBeCalled();
    expect(component).toMatchSnapshot();
  });

  test('should update a filter', async () => {
    const saveDataset = jest.fn(async () => {});
    const component = shallow<SourceFiltersTable>(
      <SourceFiltersTable
        dataset={
          getDatasetMock({
            sourceFilters: [{ value: 'tim*' }],
          }) as DataView
        }
        filterFilter={''}
        fieldWildcardMatcher={() => {}}
        saveDataset={saveDataset}
        useUpdatedUX={false}
      />
    );

    await component.instance().saveFilter({ clientId: 'tim*', value: 'ti*' });
    component.update(); // We are not calling `.setState` directly so we need to re-render

    expect(saveDataset).toBeCalled();
    expect(component).toMatchSnapshot();
  });
});
