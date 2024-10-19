/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
  ExpressionValueBoxed,
} from '../../../../../expressions/common';
import { getExpressionsService } from '../../../../../expressions/public';

/**
 * Creates a function definition for raw data visualization.
 * This function simply returns the input data without modification.
 *
 * @returns {ExpressionFunctionDefinition} The function definition for raw data visualization.
 */
export const createRawDataVisFn = (): ExpressionFunctionDefinition<
  'rawData',
  OpenSearchDashboardsDatatable,
  {},
  OpenSearchDashboardsDatatable
> => ({
  name: 'rawData',
  type: 'opensearch_dashboards_datatable',
  inputTypes: ['opensearch_dashboards_datatable'],
  help: 'Returns raw data from opensearchaggs without modification',
  args: {},
  fn(
    context: OpenSearchDashboardsDatatable,
    args?: {},
    handlers?: {}
  ): OpenSearchDashboardsDatatable {
    // Simply return the input context, which should be the opensearchaggs result
    return context;
  },
});

/**
 * Executes an expression with the given context.
 *
 * @param {string} expression - The expression to execute.
 * @param {any} context - The context to use for execution.
 * @returns {Promise<ExpressionValueBoxed>} A promise that resolves to the execution result.
 * @throws {Error} If the expression service is not available or execution fails.
 */
export async function executeExpression(
  expression: string,
  context: any
): Promise<ExpressionValueBoxed> {
  const expressionService = getExpressionsService();

  if (!expressionService) {
    throw new Error('Expression service is not available');
  }

  try {
    const result = await expressionService.execute(expression, { type: 'null' }, context);
    const data = await result.getData();
    return data as ExpressionValueBoxed;
  } catch (error) {
    throw error;
  }
}
