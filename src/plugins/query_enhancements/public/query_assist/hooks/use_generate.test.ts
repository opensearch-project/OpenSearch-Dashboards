/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react-hooks/dom';
import { coreMock } from '../../../../../core/public/mocks';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useGenerateQuery } from './use_generate';

const coreSetup = coreMock.createSetup();
const mockHttp = coreSetup.http;

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component: React.Component) => component),
}));

describe('useGenerateQuery', () => {
  beforeEach(() => {
    (useOpenSearchDashboards as jest.MockedFunction<typeof useOpenSearchDashboards>)
      // @ts-ignore for this test we only need http implemented
      .mockImplementation(() => ({
        services: {
          http: mockHttp,
        },
      }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate results', async () => {
    mockHttp.post.mockResolvedValueOnce({ query: 'test query' });
    const { result } = renderHook(() => useGenerateQuery());
    const { generateQuery } = result.current;

    await act(async () => {
      const response = await generateQuery({
        index: 'test',
        language: 'test-lang',
        question: 'test question',
      });

      expect(response).toEqual({ response: { query: 'test query' } });
    });
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useGenerateQuery());
    const { generateQuery } = result.current;
    const mockError = new Error('mockError');
    mockHttp.post.mockRejectedValueOnce(mockError);

    await act(async () => {
      const response = await generateQuery({
        index: 'test',
        language: 'test-lang',
        question: 'test question',
      });

      expect(response).toEqual({ error: mockError });
      expect(result.current.loading).toBe(false);
    });
  });

  it('should abort previous call', async () => {
    const { result } = renderHook(() => useGenerateQuery());
    const { generateQuery, abortControllerRef } = result.current;

    await act(async () => {
      await generateQuery({ index: 'test', language: 'test-lang', question: 'test question' });
      const controller = abortControllerRef.current;
      await generateQuery({ index: 'test', language: 'test-lang', question: 'test question' });

      expect(controller?.signal.aborted).toBe(true);
    });
  });

  it('should abort call with controller', async () => {
    const { result } = renderHook(() => useGenerateQuery());
    const { generateQuery, abortControllerRef } = result.current;

    await act(async () => {
      await generateQuery({ index: 'test', language: 'test-lang', question: 'test question' });
      abortControllerRef.current?.abort();

      expect(abortControllerRef.current?.signal.aborted).toBe(true);
    });
  });
});
