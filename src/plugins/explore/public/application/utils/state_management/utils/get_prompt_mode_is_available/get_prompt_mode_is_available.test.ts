/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPromptModeIsAvailable } from './get_prompt_mode_is_available';
import { Dataset } from '../../../../../../../data/common';
import { ExploreServices } from '../../../../../types';

describe('getPromptModeIsAvailable', () => {
  let services: jest.Mocked<ExploreServices>;
  let dataset: Dataset;

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
      http: {
        get: jest.fn(),
      },
    } as any;

    dataset = {
      dataSource: { id: 'test-id' },
    } as any;
  });

  it('returns false if query-assist extension is missing', async () => {
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({});
    const result = await getPromptModeIsAvailable(services, dataset);
    expect(result).toBe(false);
  });

  it('returns false if configuredLanguages is empty', async () => {
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({
      'query-assist': {},
    });
    (services.http.get as jest.Mocked<any>).mockResolvedValue({ configuredLanguages: [] });
    const result = await getPromptModeIsAvailable(services, dataset);
    expect(result).toBe(false);
  });

  it('returns true if query-assist extension exists and configuredLanguages is not empty', async () => {
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockReturnValue({
      'query-assist': {},
    });
    (services.http.get as jest.Mocked<any>).mockResolvedValue({ configuredLanguages: ['en'] });
    const result = await getPromptModeIsAvailable(services, dataset);
    expect(result).toBe(true);
  });

  it('returns false if an error is thrown', async () => {
    (services.data.query.queryString.getLanguageService().getQueryEditorExtensionMap as jest.Mocked<
      any
    >).mockImplementation(() => {
      throw new Error('Test error');
    });
    const result = await getPromptModeIsAvailable(services, dataset);
    expect(result).toBe(false);
  });
});
