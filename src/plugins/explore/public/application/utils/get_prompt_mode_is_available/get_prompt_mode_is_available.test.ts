/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
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
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({});

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(false);
  });

  it('returns false if query-assist extension exists but isEnabled$ returns false', async () => {
    const mockIsEnabled$ = jest.fn().mockReturnValue(of(false));

    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({
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

    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({
      'query-assist': {
        isEnabled$: mockIsEnabled$,
      },
    });

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(true);
    expect(mockIsEnabled$).toHaveBeenCalledWith({});
  });

  it('returns false if getting extension map throws an error', async () => {
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockImplementation(() => {
      throw new Error('Extension map error');
    });

    const result = await getPromptModeIsAvailable(services);
    expect(result).toBe(false);
  });
});
