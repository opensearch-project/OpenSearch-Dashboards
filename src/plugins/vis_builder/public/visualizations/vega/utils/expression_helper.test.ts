/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRawDataVisFn, executeExpression } from './expression_helper';
import { getExpressionsService } from '../../../../../expressions/public';
import { ExecutionContext, OpenSearchDashboardsDatatable } from '../../../../../expressions/public';

jest.mock('../../../../../expressions/public', () => ({
  getExpressionsService: jest.fn(),
}));

describe('expression_helper.ts', () => {
  describe('createRawDataVisFn', () => {
    it('should create a function definition for raw data visualization', () => {
      const result = createRawDataVisFn();
      expect(result.name).toBe('rawData');
      expect(result.type).toBe('opensearch_dashboards_datatable');
      expect(result.inputTypes).toEqual(['opensearch_dashboards_datatable']);
    });

    it('should return the input context unchanged', () => {
      const result = createRawDataVisFn();
      const context = { some: 'data' };
      const mockArgs = {};
      const mockHandlers: ExecutionContext<OpenSearchDashboardsDatatable, {}> = {
        getInitialInput: jest.fn(),
        variables: {},
        types: {},
        abortSignal: new AbortController().signal,
        inspectorAdapters: {},
      };
      expect(result.fn(context as any, mockArgs, mockHandlers)).toBe(context);
    });
  });

  describe('executeExpression', () => {
    it('should execute an expression and return the result', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        getData: jest.fn().mockResolvedValue({ result: 'data' }),
      });
      (getExpressionsService as jest.Mock).mockReturnValue({
        execute: mockExecute,
      });

      const result = await executeExpression('test expression', { context: 'data' });
      expect(result).toEqual({ result: 'data' });
      expect(mockExecute).toHaveBeenCalledWith(
        'test expression',
        { type: 'null' },
        { context: 'data' }
      );
    });

    it('should throw an error if expression service is not available', async () => {
      (getExpressionsService as jest.Mock).mockReturnValue(null);

      await expect(executeExpression('test', {})).rejects.toThrow(
        'Expression service is not available'
      );
    });
  });
});
