/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { showSaveModal } from './show_saved_object_save_modal';

const I18nContext = ({ children }: { children: React.ReactNode }) => <>{children}</>;

test('a save that settles after the modal was closed does not close it again', async () => {
  let resolveSave: (value: { id: string }) => void = () => {};
  let props: any;
  const Modal = (p: any) => {
    props = p;
    return null;
  };
  const onSave = jest.fn(
    () =>
      new Promise<{ id: string }>((resolve) => {
        resolveSave = resolve;
      })
  );
  act(() => {
    showSaveModal(<Modal onSave={onSave} onClose={() => {}} />, I18nContext as any);
  });

  const saving = props.onSave();
  act(() => props.onClose());
  resolveSave({ id: 'new-id' });

  await expect(saving).resolves.toEqual({ id: 'new-id' });
  expect(document.body.childElementCount).toBe(0);
});
