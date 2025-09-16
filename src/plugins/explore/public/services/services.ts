/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionsStart } from '../../../../plugins/expressions/public';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../types';

export const [getServices, setServices] = createGetterSetter<ExploreServices>('ExploreServices');

export const [getExpressions, setExpressions] = createGetterSetter<ExpressionsStart>('expressions');
