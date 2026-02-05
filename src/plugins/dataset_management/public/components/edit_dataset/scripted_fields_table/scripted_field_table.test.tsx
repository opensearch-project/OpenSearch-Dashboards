/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { ScriptedFieldsTable } from '../scripted_fields_table';
// @ts-expect-error TS2724, TS2305 TODO(ts-error): fixme
import { IDataset, DataView } from '../../../../../../plugins/data/common/datasets';

jest.mock('@elastic/eui', () => ({
  EuiTitle: 'eui-title',
  EuiText: 'eui-text',
  EuiHorizontalRule: 'eui-horizontal-rule',
  EuiSpacer: 'eui-spacer',
  EuiCallOut: 'eui-call-out',
  EuiLink: 'eui-link',
  EuiOverlayMask: 'eui-overlay-mask',
  EuiConfirmModal: 'eui-confirm-modal',
  Comparators: {
    property: () => {},
    default: () => {},
  },
}));
jest.mock('./components/header', () => ({ Header: 'header' }));
jest.mock('./components/call_outs', () => ({ CallOuts: 'call-outs' }));
jest.mock('./components/table', () => ({
  // Note: this seems to fix React complaining about non lowercase attributes
  Table: () => {
    return 'table';
  },
}));

const helpers = {
  redirectToRoute: () => {},
  getRouteHref: () => '#',
};

const getDatasetMock = (mockedFields: any = {}) => ({ ...mockedFields } as IDataset);

describe('ScriptedFieldsTable', () => {
  let dataset: DataView;

  beforeEach(() => {
    dataset = getDatasetMock({
      getScriptedFields: () => [
        { name: 'ScriptedField', lang: 'painless', script: 'x++' },
        { name: 'JustATest', lang: 'painless', script: 'z++' },
      ],
    }) as DataView;
  });

  test('should render normally', async () => {
    const component = shallow<ScriptedFieldsTable>(
      <ScriptedFieldsTable
        dataset={dataset}
        helpers={helpers}
        painlessDocLink={'painlessDoc'}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    // Allow the componentWillMount code to execute
    // https://github.com/airbnb/enzyme/issues/450
    await component.update(); // Fire `componentWillMount()`
    await component.update(); // Force update the component post async actions

    expect(component).toMatchSnapshot();
  });

  test('should filter based on the query bar', async () => {
    const component = shallow(
      <ScriptedFieldsTable
        dataset={dataset}
        helpers={helpers}
        painlessDocLink={'painlessDoc'}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    // Allow the componentWillMount code to execute
    // https://github.com/airbnb/enzyme/issues/450
    await component.update(); // Fire `componentWillMount()`
    await component.update(); // Force update the component post async actions

    component.setProps({ fieldFilter: 'Just' });
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('should filter based on the lang filter', async () => {
    const component = shallow<ScriptedFieldsTable>(
      <ScriptedFieldsTable
        dataset={
          getDatasetMock({
            getScriptedFields: () => [
              { name: 'ScriptedField', lang: 'painless', script: 'x++' },
              { name: 'JustATest', lang: 'painless', script: 'z++' },
              { name: 'Bad', lang: 'somethingElse', script: 'z++' },
            ],
          }) as DataView
        }
        painlessDocLink={'painlessDoc'}
        helpers={helpers}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    // Allow the componentWillMount code to execute
    // https://github.com/airbnb/enzyme/issues/450
    await component.update(); // Fire `componentWillMount()`
    await component.update(); // Force update the component post async actions

    component.setProps({ scriptedFieldLanguageFilter: 'painless' });
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('should hide the table if there are no scripted fields', async () => {
    const component = shallow(
      <ScriptedFieldsTable
        dataset={
          getDatasetMock({
            getScriptedFields: () => [],
          }) as DataView
        }
        painlessDocLink={'painlessDoc'}
        helpers={helpers}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    // Allow the componentWillMount code to execute
    // https://github.com/airbnb/enzyme/issues/450
    await component.update(); // Fire `componentWillMount()`
    await component.update(); // Force update the component post async actions

    expect(component).toMatchSnapshot();
  });

  test('should show a delete modal', async () => {
    const component = shallow<ScriptedFieldsTable>(
      <ScriptedFieldsTable
        dataset={dataset}
        helpers={helpers}
        painlessDocLink={'painlessDoc'}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    await component.update(); // Fire `componentWillMount()`
    component.instance().startDeleteField({ name: 'ScriptedField', lang: '', script: '' });
    await component.update();

    // Ensure the modal is visible
    expect(component).toMatchSnapshot();
  });

  test('should delete a field', async () => {
    const removeScriptedField = jest.fn();
    const component = shallow<ScriptedFieldsTable>(
      <ScriptedFieldsTable
        dataset={
          ({
            ...dataset,
            removeScriptedField,
          } as unknown) as DataView
        }
        helpers={helpers}
        painlessDocLink={'painlessDoc'}
        saveDataset={async () => {}}
        useUpdatedUX
      />
    );

    await component.update(); // Fire `componentWillMount()`
    component.instance().startDeleteField({ name: 'ScriptedField', lang: '', script: '' });

    await component.update();
    await component.instance().deleteField();
    await component.update();

    expect(removeScriptedField).toBeCalled();
  });
});
