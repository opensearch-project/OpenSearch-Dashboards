/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getServices } from '../../opensearch_dashboards_services';

export const Homepage = () => {
  const { sectionTypes } = getServices();
  console.log(sectionTypes);

  return <span>Hello world</span>;
};
