/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of, Subject } from 'rxjs';
import { getPromptModeIsAvailable } from './get_prompt_mode_is_available';
import { ExploreServices } from '../../../types';

describe('getPromptModeIsAvailable', () => {
  let services: jest.Mocked<ExploreServices>;

  beforeEach(() => {
    services = {
      data: {
        query: {
          queryString: {
            getLanguageService: jest.fn().mockReturnValue({
              getQueryEditorExtensionMap: jest.fn(),
            }),
          },
        },
      },
    } as any;

    jest.clearAllMocks();
  });

  it('returns false if query-assist extension is missing', async () => {
    (
      services.data.query.queryString.getLanguageService()
        .getQueryEditorExtensionMap as jest.Mocked<any>
    ).mockReturnValue({});

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(false);
  });

  it('returns false if query-assist extension exists but isEnabled$ returns false', async () => {
    const mockIsEnabled$ = jest.fn().mockReturnValue(of(false));

    (
      services.data.query.queryString.getLanguageService()
        .getQueryEditorExtensionMap as jest.Mocked<any>
    ).mockReturnValue({
      'query-assist': {
        isEnabled$: mockIsEnabled$,
      },
    });

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(false);
    expect(mockIsEnabled$).toHaveBeenCalledWith({});
  });

  it('returns true if query-assist extension exists and isEnabled$ returns true', async () => {
    const mockIsEnabled$ = jest.fn().mockReturnValue(of(true));

    (
      services.data.query.queryString.getLanguageService()
        .getQueryEditorExtensionMap as jest.Mocked<any>
    ).mockReturnValue({
      'query-assist': {
        isEnabled$: mockIsEnabled$,
      },
    });

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(true);
    expect(mockIsEnabled$).toHaveBeenCalledWith({});
  });

  it('returns false if getting extension map throws an error', async () => {
    (
      services.data.query.queryString.getLanguageService()
        .getQueryEditorExtensionMap as jest.Mocked<any>
    ).mockImplementation(() => {
      throw new Error('Extension map error');
    });

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(false);
  });

  describe('with an abort signal', () => {
    const mockIsEnabled = (isEnabled$: unknown) =>
      (
        services.data.query.queryString.getLanguageService()
          .getQueryEditorExtensionMap as jest.Mocked<any>
      ).mockReturnValue({ 'query-assist': { isEnabled$: jest.fn().mockReturnValue(isEnabled$) } });

    it('resolves false and unsubscribes when aborted before isEnabled$ emits', async () => {
      const enabled$ = new Subject<boolean>();
      mockIsEnabled(enabled$);
      const controller = new AbortController();

      const result = getPromptModeIsAvailable(services, { signal: controller.signal });
      await Promise.resolve();
      expect(enabled$.observers.length).toBeGreaterThan(0);
      controller.abort();

      expect(await result).toBe(false);
      expect(enabled$.observers.length).toBe(0);
    });

    it('resolves false without subscribing when the signal is already aborted', async () => {
      const enabled$ = new Subject<boolean>();
      mockIsEnabled(enabled$);
      const controller = new AbortController();
      controller.abort();

      expect(await getPromptModeIsAvailable(services, { signal: controller.signal })).toBe(false);
      expect(enabled$.observers.length).toBe(0);
    });

    it('returns the emitted value and drops its abort listener when not aborted', async () => {
      const enabled$ = new Subject<boolean>();
      mockIsEnabled(enabled$);
      const controller = new AbortController();
      const removeListener = jest.spyOn(controller.signal, 'removeEventListener');

      const result = getPromptModeIsAvailable(services, { signal: controller.signal });
      await Promise.resolve();
      enabled$.next(true);

      expect(await result).toBe(true);
      expect(removeListener.mock.calls.some(([type]) => type === 'abort')).toBe(true);
    });
  });

  it('behaves as before when called without options', async () => {
    const enabled$ = new Subject<boolean>();
    (
      services.data.query.queryString.getLanguageService()
        .getQueryEditorExtensionMap as jest.Mocked<any>
    ).mockReturnValue({ 'query-assist': { isEnabled$: jest.fn().mockReturnValue(enabled$) } });

    const result = getPromptModeIsAvailable(services);
    await Promise.resolve();
    enabled$.next(true);

    expect(await result).toBe(true);
  });
});
