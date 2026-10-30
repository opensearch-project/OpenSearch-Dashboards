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

import React from 'react';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

jest.mock('.', () => {
  const MockSavedObjectSaveModal = () => null;
  return { SavedObjectSaveModal: MockSavedObjectSaveModal };
});

import { SavedObjectSaveModal } from '.';
import { SavedObjectSaveModalOrigin } from './saved_object_save_modal_origin';

// #3: onModalSave must RETURN props.onSave(...) so the upstream modal awaits the
// full save and keeps the confirm button loading, preventing a double-submit.
describe('SavedObjectSaveModalOrigin onModalSave', () => {
  it('returns the promise from props.onSave', () => {
    const pending = new Promise(() => {});
    const onSave = jest.fn(() => pending);
    const wrapper = shallowWithI18nProvider(
      <SavedObjectSaveModalOrigin
        onSave={onSave}
        onClose={() => {}}
        documentInfo={{ id: 'doc-1', title: 'Doc', description: '' }}
        objectType="dashboard"
      />
    );
    const onModalSave = wrapper.find(SavedObjectSaveModal).prop('onSave') as (p: any) => unknown;
    const result = onModalSave({
      newTitle: 'Doc',
      newCopyOnSave: false,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: () => {},
      newDescription: '',
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result).toBe(pending);
  });
});
