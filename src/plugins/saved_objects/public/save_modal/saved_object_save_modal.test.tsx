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

import { SavedObjectSaveModal } from './saved_object_save_modal';

import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { act } from 'react-dom/test-utils';

describe('SavedObjectSaveModal', () => {
  it('should render matching snapshot', () => {
    const wrapper = shallow(
      <SavedObjectSaveModal
        onSave={() => void 0}
        onClose={() => void 0}
        title={'Saved Object title'}
        showCopyOnSave={false}
        objectType="visualization"
        showDescription={true}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('allows specifying custom save button label', () => {
    const wrapper = mountWithIntl(
      <SavedObjectSaveModal
        onSave={() => void 0}
        onClose={() => void 0}
        title={'Saved Object title'}
        showCopyOnSave={false}
        objectType="visualization"
        showDescription={true}
        confirmButtonLabel="Save and done"
      />
    );
    expect(wrapper.find('button[data-test-subj="confirmSaveSavedObjectButton"]').text()).toBe(
      'Save and done'
    );
  });

  // Regression: if onSave resolves WITHOUT closing the modal
  // (e.g. a consumer rejects the input and keeps the modal open), the confirm
  // button must not be stuck in a permanent loading state.
  it('re-enables the confirm button when onSave resolves without closing the modal', async () => {
    let resolveSave: () => void = () => void 0;
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const wrapper = mountWithIntl(
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => void 0}
        title={'Saved Object title'}
        showCopyOnSave={false}
        objectType="visualization"
        showDescription={true}
      />
    );

    const confirmIsLoading = () =>
      wrapper
        .find('EuiSmallButton[data-test-subj="confirmSaveSavedObjectButton"]')
        .prop('isLoading');

    wrapper.find('form#savedObjectSaveModalForm').simulate('submit');
    // while awaiting onSave, the button is loading
    wrapper.update();
    expect(confirmIsLoading()).toBe(true);

    // onSave resolves but the modal stays mounted (no close): button recovers
    await act(async () => {
      resolveSave();
      await new Promise((r) => setTimeout(r, 0));
    });
    wrapper.update();
    expect(confirmIsLoading()).toBe(false);
  });

  // Regression (#3): while onSave is still running (the modal returns its
  // save promise so the button stays loading), a second submit must be
  // ignored so the save/copy does not run twice.
  it('does not call onSave again when submitted while a previous save is pending', async () => {
    const onSave = jest.fn(() => new Promise<void>(() => {}));
    const wrapper = mountWithIntl(
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => void 0}
        title={'Saved Object title'}
        showCopyOnSave={false}
        objectType="visualization"
        showDescription={true}
      />
    );

    wrapper.find('form#savedObjectSaveModalForm').simulate('submit');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    // second submit while the first is still pending
    wrapper.find('form#savedObjectSaveModalForm').simulate('submit');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // N1: if a consumer's onSave rejects, the finally must still reset isLoading so
  // the confirm button is not left stuck loading.
  it('re-enables the confirm button when onSave rejects', async () => {
    const onSave = jest.fn(() => Promise.reject(new Error('boom')));
    const wrapper = mountWithIntl(
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => void 0}
        title={'Saved Object title'}
        showCopyOnSave={false}
        objectType="visualization"
        showDescription={true}
      />
    );
    const confirmIsLoading = () =>
      wrapper
        .find('EuiSmallButton[data-test-subj="confirmSaveSavedObjectButton"]')
        .prop('isLoading');

    await act(async () => {
      // Invoke directly and swallow the rejection (onFormSubmit does not await it).
      await (wrapper.instance() as any).saveSavedObject().catch(() => void 0);
    });
    wrapper.update();
    expect(confirmIsLoading()).toBe(false);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
