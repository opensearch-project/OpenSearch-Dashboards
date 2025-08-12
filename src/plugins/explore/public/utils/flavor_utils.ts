/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../common';

export const getCurrentFlavor = (pathname?: string): ExploreFlavor => {
  try {
    const currentPath = pathname || window.location.pathname;

    if (currentPath.includes('/traces') || currentPath.includes('/trace')) {
      return ExploreFlavor.Traces;
    }
    if (currentPath.includes('/metrics')) {
      return ExploreFlavor.Metrics;
    }
    return ExploreFlavor.Logs;
  } catch (error) {
    return ExploreFlavor.Logs;
  }
};

export const isTraceFlavor = (pathname?: string): boolean => {
  return getCurrentFlavor(pathname) === ExploreFlavor.Traces;
};

export const isMetricsFlavor = (pathname?: string): boolean => {
  return getCurrentFlavor(pathname) === ExploreFlavor.Metrics;
};

export const isLogsFlavor = (pathname?: string): boolean => {
  return getCurrentFlavor(pathname) === ExploreFlavor.Logs;
};
