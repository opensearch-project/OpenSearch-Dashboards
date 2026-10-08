/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isClientAuthError,
  maybeNotifyPermissionDenied,
  notifyPermissionDenied,
  resetPermissionToast,
} from './permission_toast';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: (_k: string, o: { defaultMessage: string }) => o.defaultMessage },
}));

const addWarning = jest.fn();
const makeServices = () => ({ notifications: { toasts: { addWarning } } }) as unknown as any;

describe('permission_toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPermissionToast();
  });

  describe('isClientAuthError', () => {
    it.each([
      [{ statusCode: 403 }, true],
      [{ statusCode: 401 }, true],
      [{ body: { statusCode: 403 } }, true],
      [{ status: 403 }, true],
      [new Error('security_exception: no permissions for [indices:data/read/search]'), true],
      [new Error('403 Forbidden'), true],
      [{ statusCode: 500 }, false],
      [{ statusCode: 404 }, true], // 4xx family — still a client error
      [new Error('some unrelated failure'), false],
      [undefined, false],
    ])('classifies %j → %s', (err, expected) => {
      expect(isClientAuthError(err)).toBe(expected);
    });
  });

  it('shows exactly ONE warning toast across many auth failures', () => {
    const services = makeServices();
    maybeNotifyPermissionDenied(services, { statusCode: 403 }); // cat.indices
    maybeNotifyPermissionDenied(services, { statusCode: 403 }); // card preview #1
    maybeNotifyPermissionDenied(services, new Error('security_exception')); // card preview #2
    expect(addWarning).toHaveBeenCalledTimes(1);
    expect(addWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Index health & size unavailable — check permissions.',
      })
    );
  });

  it('does NOT toast for non-4xx failures', () => {
    const services = makeServices();
    expect(maybeNotifyPermissionDenied(services, { statusCode: 500 })).toBe(false);
    expect(maybeNotifyPermissionDenied(services, new Error('timeout'))).toBe(false);
    expect(addWarning).not.toHaveBeenCalled();
  });

  it('toasts again after reset (a new view / data source)', () => {
    const services = makeServices();
    notifyPermissionDenied(services);
    notifyPermissionDenied(services);
    expect(addWarning).toHaveBeenCalledTimes(1);

    resetPermissionToast();
    notifyPermissionDenied(services);
    expect(addWarning).toHaveBeenCalledTimes(2);
  });
});
