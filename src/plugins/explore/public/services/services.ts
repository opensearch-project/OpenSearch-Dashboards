/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../types';

export const [getServices, setServices] = createGetterSetter<ExploreServices>('ExploreServices');
