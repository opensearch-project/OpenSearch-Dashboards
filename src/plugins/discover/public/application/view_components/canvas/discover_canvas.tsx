/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getServices } from '../../../opensearch_dashboards_services';

export const DiscoverCanvas = async () => {
  const services = await getServices();

  if (!services) {
    return { default: () => <div>Test Canvas</div> };
  }
  return { default: () => <div>Test Canvas has services</div> };
};
