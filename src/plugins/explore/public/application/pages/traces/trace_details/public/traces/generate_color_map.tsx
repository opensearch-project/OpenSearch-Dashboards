/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultColors } from '../utils/shared_const';

export const generateColorMap = (transformedHits: any[]): Record<string, string> => {
  const serviceNames = new Set<string>();
  // Extract unique service names from the hits
  transformedHits.forEach((hit) => {
    const serviceName = hit.serviceName;
    if (serviceName) {
      serviceNames.add(serviceName);
    }
  });

  // Convert to array and sort for consistent color assignment
  const sortedServiceNames = Array.from(serviceNames).sort();
  const colorMap: Record<string, string> = {};
  sortedServiceNames.forEach((serviceName, index) => {
    colorMap[serviceName] = defaultColors[index % defaultColors.length];
  });
  return colorMap;
};
