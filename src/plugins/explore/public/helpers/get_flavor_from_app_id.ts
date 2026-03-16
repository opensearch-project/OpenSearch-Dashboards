/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { take } from 'rxjs/operators';
import { ExploreFlavor } from '../../common';
import { ExploreServices } from '../types';

/**
 * Extracts the flavor ID from an app ID string
 * App ID format: "explore/{flavor}" -> returns the flavor part
 */
export const getFlavorFromAppId = (appId: string | undefined): ExploreFlavor | null => {
  const flavorFromAppId = appId?.split('/')?.[1];
  return flavorFromAppId ? (flavorFromAppId as ExploreFlavor) : null;
};

/**
 * Gets the current app ID from the application service
 */
export const getCurrentAppId = async (services: ExploreServices): Promise<string | undefined> => {
  return services.core.application.currentAppId$.pipe(take(1)).toPromise();
};

/**
 * Gets the current flavor ID by reading the app ID and extracting the flavor part
 */
export const getCurrentFlavor = async (
  services: ExploreServices
): Promise<ExploreFlavor | null> => {
  const currentAppId = await getCurrentAppId(services);
  return getFlavorFromAppId(currentAppId);
};
