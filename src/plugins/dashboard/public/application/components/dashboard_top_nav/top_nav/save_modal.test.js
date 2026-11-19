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

import { shallow } from 'enzyme';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

jest.mock('../../../../../../saved_objects/public', () => ({
  SavedObjectSaveModal: () => null,
}));

import { DashboardSaveModal } from './save_modal';

test('renders DashboardSaveModal', () => {
  const component = shallowWithI18nProvider(
    <DashboardSaveModal
      onSave={() => {}}
      onClose={() => {}}
      title="dash title"
      description="dash description"
      timeRestore={true}
      showCopyOnSave={true}
    />
  );
  expect(component).toMatchSnapshot();
});

test('renders the save options', () => {
  const component = shallowWithI18nProvider(
    <DashboardSaveModal
      onSave={() => {}}
      onClose={() => {}}
      title="dash title"
      description="dash description"
      timeRestore={true}
      showCopyOnSave={true}
    />
  );
  const options = component.find('SavedObjectSaveModal').prop('options');
  expect(shallow(<div>{options({ copyOnSave: false })}</div>)).toMatchSnapshot();
  component.setState({ copyPanels: true });
  expect(
    shallow(
      <div>{component.find('SavedObjectSaveModal').prop('options')({ copyOnSave: true })}</div>
    )
  ).toMatchSnapshot();
});

describe('copy panels', () => {
  const render = (onSave = jest.fn(), onClose = jest.fn()) =>
    shallowWithI18nProvider(
      <DashboardSaveModal
        onSave={onSave}
        onClose={onClose}
        title="dash title"
        description=""
        timeRestore={false}
        showCopyOnSave={true}
      />
    );
  const save = (component, newCopyOnSave) =>
    component.find('SavedObjectSaveModal').prop('onSave')({
      newTitle: 'new',
      newCopyOnSave,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: () => {},
    });
  const options = (component, copyOnSave) =>
    shallow(<div>{component.find('SavedObjectSaveModal').prop('options')({ copyOnSave })}</div>);

  test('shows the option only for save as new', () => {
    const component = render();
    const find = (c) => options(component, c).find('[data-test-subj="copyPanelsOnSave"]');
    expect(find(false)).toHaveLength(0);
    expect(find(true)).toHaveLength(1);
  });

  test('passes copy panels only for save as new', () => {
    const onSave = jest.fn();
    const component = render(onSave);
    component.setState({ copyPanels: true });
    save(component, false);
    expect(onSave.mock.calls[0][0].newCopyPanels).toBeUndefined();
    save(component, true);
    expect(onSave.mock.calls[1][0].newCopyPanels).toEqual({
      titleTemplate: '{{panelTitle}} (copy)',
    });
  });

  test('is invalid only for save as new with a bad template', () => {
    const component = render();
    const isValid = (copyOnSave) =>
      component.find('SavedObjectSaveModal').prop('isValid')({ copyOnSave });
    component.setState({ copyPanels: true, panelTitleTemplate: '' });
    expect(isValid(true)).toBe(false);
    expect(isValid(false)).toBe(true);
    component.setState({ panelTitleTemplate: '{{panelTitle}}' });
    expect(isValid(true)).toBe(true);
  });

  test('closing aborts the in-flight save', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const component = render(onSave, onClose);
    save(component, true);
    const { signal } = onSave.mock.calls[0][0];
    component.find('SavedObjectSaveModal').prop('onClose')();
    expect(signal.aborted).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });
});
