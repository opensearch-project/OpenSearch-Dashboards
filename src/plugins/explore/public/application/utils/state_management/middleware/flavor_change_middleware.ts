/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { ExploreServices } from '../../../../types';
import { setColumns } from '../slices';
import { getCurrentFlavor } from '../../../../utils/flavor_utils';
import { ExploreFlavor, DEFAULT_TRACE_COLUMNS_SETTING } from '../../../../../common';

/**
 * Middleware that detects flavor changes and updates columns accordingly
 */
export const createFlavorChangeMiddleware = (services: ExploreServices): Middleware => {
  let previousFlavor: ExploreFlavor | null = null;

  return (store) => (next) => (action) => {
    // Pass the action to the next middleware first
    const result = next(action);

    try {
      // Get current flavor after the action has been processed
      const currentFlavor = getCurrentFlavor();

      // Check if flavor has changed (or if this is the first time we're detecting flavor)
      if (previousFlavor !== currentFlavor) {
        // Flavor has changed, update columns based on new flavor
        let newColumns: string[];

        if (currentFlavor === ExploreFlavor.Traces) {
          // Use trace-specific columns
          newColumns = services.uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING) || [
            'spanId',
            'status.code',
            'attributes.http.status_code',
            'serviceName',
            'name',
            'durationInNanos',
          ];
        } else {
          // Use default columns for logs and metrics
          newColumns = services.uiSettings?.get('defaultColumns') || ['_source'];
        }

        // Dispatch the setColumns action
        store.dispatch(setColumns(newColumns));
      }

      // Update previous flavor for next comparison
      previousFlavor = currentFlavor;
    } catch (error) {
      // Silently handle errors to avoid breaking the application
      // This could happen if getCurrentFlavor fails due to navigation issues
    }

    return result;
  };
};
