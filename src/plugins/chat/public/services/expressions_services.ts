/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../opensearch_dashboards_utils/public';
import { ExpressionsStart } from '../../../expressions/public';

/**
 * Getter and setter for the ExpressionLoader
 * This allows us to access the ExpressionLoader from anywhere in the chat plugin
 */
export const [getExpressionLoader, setExpressionLoader] = createGetterSetter<
  ExpressionsStart['ExpressionLoader']
>('expressions.ExpressionLoader');

/**
 * Getter and setter for the ReactExpressionRenderer
 * This allows us to access the ReactExpressionRenderer from anywhere in the chat plugin
 */
export const [getReactExpressionRenderer, setReactExpressionRenderer] = createGetterSetter<
  ExpressionsStart['ReactExpressionRenderer']
>('expressions.ReactExpressionRenderer');
