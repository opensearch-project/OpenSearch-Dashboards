/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '@osd/logging';
import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
  SavedObjectsFindResponse,
} from '../../../../core/server';
import { APP_API, APP_PATH, AugmentVisSavedObjectAttributes } from '../../common';
import { PER_PAGE_VALUE } from '../../../saved_objects/common';
import { getAugmentVisSavedObjects, getStats } from './stats_helpers';

export const registerStatsRoute = (router: IRouter, logger: Logger) => {
  router.get(
    {
      path: `${APP_API}${APP_PATH.STATS}`,
      validate: {},
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const savedObjectsClient = context.core.savedObjects.client;
        const augmentVisSavedObjects: SavedObjectsFindResponse<AugmentVisSavedObjectAttributes> = await getAugmentVisSavedObjects(
          savedObjectsClient,
          PER_PAGE_VALUE
        );
        const stats = getStats(augmentVisSavedObjects);
        return response.ok({
          body: stats,
        });
      } catch (error: any) {
        logger.error(error);
        return response.customError({
          statusCode: error.statusCode || 500,
          body: {
            message: error.message,
            attributes: {
              error: error.body?.error || error.message,
            },
          },
        });
      }
    }
  );
};
