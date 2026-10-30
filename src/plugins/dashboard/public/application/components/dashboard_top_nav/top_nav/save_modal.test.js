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

import { shallowWithI18nProvider, mountWithI18nProvider } from 'test_utils/enzyme_helpers';
import { findTestSubject } from '@elastic/eui/lib/test';

jest.mock('../../../../../../saved_objects/public', () => {
  const MockSavedObjectSaveModal = () => null;
  return { SavedObjectSaveModal: MockSavedObjectSaveModal };
});

import { SavedObjectSaveModal } from '../../../../../../saved_objects/public';
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

// The "Copy panels" control is only meaningful when saving as a NEW dashboard,
// so it must render only when the upstream save-as-new (copyOnSave) is checked.
// renderDashboardSaveOptions is what the options-as-function passes through, so
// exercising it directly with copyOnSave false/true covers the gating contract.
describe('Copy panels visibility is gated on copyOnSave', () => {
  const makeInstance = () => {
    const component = shallowWithI18nProvider(
      <DashboardSaveModal
        onSave={() => {}}
        onClose={() => {}}
        title="dash title"
        description=""
        timeRestore={false}
        showCopyOnSave={true}
      />
    );
    return component.instance();
  };

  it('hides the Copy panels switch AND template when copyOnSave is false', () => {
    const inst = makeInstance();
    inst.setState({ copyPanels: true }); // even with copyPanels on, nothing shows
    const options = mountWithI18nProvider(<div>{inst.renderDashboardSaveOptions(false)}</div>);
    expect(findTestSubject(options, 'copyPanelsOnSave').exists()).toBe(false);
    expect(findTestSubject(options, 'copyPanelsTitleTemplate').exists()).toBe(false);
  });

  it('shows the Copy panels switch when copyOnSave is true (template only once copyPanels is on)', () => {
    const inst = makeInstance();
    const off = mountWithI18nProvider(<div>{inst.renderDashboardSaveOptions(true)}</div>);
    expect(findTestSubject(off, 'copyPanelsOnSave').exists()).toBe(true);
    // template hidden until the Copy panels switch itself is on
    expect(findTestSubject(off, 'copyPanelsTitleTemplate').exists()).toBe(false);
    inst.setState({ copyPanels: true });
    const on = mountWithI18nProvider(<div>{inst.renderDashboardSaveOptions(true)}</div>);
    expect(findTestSubject(on, 'copyPanelsTitleTemplate').exists()).toBe(true);
  });

  it('passes options as a function so upstream renders it with live copyOnSave', () => {
    const component = shallowWithI18nProvider(
      <DashboardSaveModal
        onSave={() => {}}
        onClose={() => {}}
        title="dash title"
        description=""
        timeRestore={false}
        showCopyOnSave={true}
      />
    );
    const optionsProp = component.find(SavedObjectSaveModal).prop('options');
    expect(typeof optionsProp).toBe('function');
    // invoking with copyOnSave=false yields no Copy panels switch; true yields one
    const hidden = mountWithI18nProvider(<div>{optionsProp({ copyOnSave: false })}</div>);
    const shown = mountWithI18nProvider(<div>{optionsProp({ copyOnSave: true })}</div>);
    expect(findTestSubject(hidden, 'copyPanelsOnSave').exists()).toBe(false);
    expect(findTestSubject(shown, 'copyPanelsOnSave').exists()).toBe(true);
  });
});

// #3: saveDashboard must RETURN the onSave promise so the upstream modal awaits
// the full copy+save and keeps the button loading, preventing a double-submit.
// A validation early-return still returns undefined (keeps the button enabled).
describe('saveDashboard returns the onSave result (#3)', () => {
  const makeModal = (onSave) =>
    shallowWithI18nProvider(
      <DashboardSaveModal
        onSave={onSave}
        onClose={() => {}}
        title="dash title"
        description=""
        timeRestore={false}
        showCopyOnSave={true}
      />
    ).instance();

  it('returns the promise from props.onSave', () => {
    const pending = new Promise(() => {});
    const onSave = jest.fn(() => pending);
    const inst = makeModal(onSave);
    const result = inst.saveDashboard({
      newTitle: 'dash title',
      newCopyOnSave: true,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: () => {},
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result).toBe(pending);
  });

  it('returns undefined and does not call onSave when the title template is invalid', () => {
    const onSave = jest.fn();
    const inst = makeModal(onSave);
    inst.setState({ copyPanels: true, titleTemplate: '' });
    const result = inst.saveDashboard({
      newTitle: 'dash title',
      newCopyOnSave: true,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: () => {},
    });
    expect(onSave).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('calls onSave when the title template is only {{panelTitle}}', () => {
    const onSave = jest.fn();
    const inst = makeModal(onSave);
    inst.setState({ copyPanels: true, titleTemplate: '{{panelTitle}}' });
    inst.saveDashboard({
      newTitle: 'dash title',
      newCopyOnSave: true,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: () => {},
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
