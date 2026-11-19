/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from 'react-dom/test-utils';
import { showCloneModal } from './show_clone_modal';

const click = (subj: string) =>
  (document.querySelector(`[data-test-subj="${subj}"]`) as HTMLButtonElement).click();

test('a clone that settles after Cancel does not close the modal again', async () => {
  let resolveClone: (value: { id: string }) => void = () => {};
  const onClone = jest.fn(
    () =>
      new Promise<{ id: string }>((resolve) => {
        resolveClone = resolve;
      })
  );
  await act(async () => {
    showCloneModal(onClone, 'title');
  });

  await act(async () => click('cloneConfirmButton'));
  await act(async () => click('cloneCancelButton'));
  expect(document.body.childElementCount).toBe(0);

  await act(async () => resolveClone({ id: 'x' }));
  expect(onClone).toHaveBeenCalledTimes(1);
  expect(document.body.childElementCount).toBe(0);
});
