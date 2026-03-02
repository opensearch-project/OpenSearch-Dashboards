/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../core/public';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { HealthCheckServiceStart } from '../../../core/public/healthcheck';
import { createGetterSetter } from '../../opensearch_dashboards_utils/common';

export const [getHealthCheck, setHealthCheck] = createGetterSetter<HealthCheckServiceStart>(
  'HealthCheck'
);
export const [getCore, setCore] = createGetterSetter<CoreStart>('CoreStart');
