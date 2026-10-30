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

import { showCloneModal } from './show_clone_modal';

const flush = () => new Promise((r) => setTimeout(r, 0));

// Minimal stub of DashboardCloneModal: it exposes the onClone it received so the
// test can drive the "confirm then cancel mid-copy" sequence directly.
let lastModalProps: any;
jest.mock('./clone_modal', () => ({
  DashboardCloneModal: (props: any) => {
    lastModalProps = props;
    return null;
  },
}));

jest.mock('@osd/i18n/react', () => ({
  I18nProvider: ({ children }: any) => children,
}));

describe('showCloneModal (cancel during copy)', () => {
  beforeEach(() => {
    lastModalProps = undefined;
    document.body.innerHTML = '';
  });

  it('does not throw or double-remove the container when Cancel aborts an in-flight copy', async () => {
    // onClone resolves with an AbortError after the modal has already been closed
    // by onCancel -- mirroring the real abort path.
    const onClone = jest.fn(async () => ({
      error: Object.assign(new Error('Copy panels aborted'), { name: 'AbortError' }),
    }));

    showCloneModal(onClone as any, 'My dashboard');
    await flush();
    expect(lastModalProps).toBeDefined();

    // user confirms -> onCloneConfirmed starts the (aborting) copy
    const confirmPromise = lastModalProps.onClone(
      'My dashboard Copy',
      false,
      () => {},
      true,
      '{{panelTitle}} (copy)',
      new AbortController().signal
    );

    // NOTE: this drives onClone/onClose directly (DashboardCloneModal is mocked),
    // so it covers the onCloneConfirmed AbortError short-circuit. The real
    // Cancel -> abortController.abort() -> onClose ordering inside
    // DashboardCloneModal is covered by the functional UI tests.
    // user clicks Cancel -> the modal closes synchronously (container detached)
    expect(() => lastModalProps.onClose()).not.toThrow();

    // the aborted copy now resolves; onCloneConfirmed must NOT close again / throw
    await expect(confirmPromise).resolves.toBeUndefined();
    // exactly one clean removal: the container is gone and nothing lingers
    expect(document.body.children.length).toBe(0);
  });

  it('closeModal is idempotent (calling onClose twice does not throw)', async () => {
    showCloneModal((async () => ({ id: 'x' })) as any, 'My dashboard');
    await flush();
    expect(() => {
      lastModalProps.onClose();
      lastModalProps.onClose();
    }).not.toThrow();
  });
});
