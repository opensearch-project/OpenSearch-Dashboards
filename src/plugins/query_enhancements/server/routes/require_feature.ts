/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, RequestHandler } from 'opensearch-dashboards/server';
import { QueryEnhancementsFeature } from '../../common/feature_flags';
import { isFeatureEnabled } from '../utils/feature_flags';

/**
 * Body returned when a route's feature is disabled. Stable so the client can distinguish "turned
 * off" from a transport failure and fall back instead of retrying.
 */
export const FEATURE_DISABLED_MESSAGE = 'Feature is not enabled';

/**
 * Wraps a handler so it only runs while `feature` is enabled.
 *
 * The check is per request rather than at registration, so disabling a flag through DynamicConfig
 * takes effect immediately — including for jobs already in flight, whose polls then stop instead of
 * running against a feature that is meant to be off.
 *
 * A resolution failure denies rather than allows: the flags default to off, so an unreadable config
 * must not open a gated route.
 */
export const requireFeature =
  <P, Q, B>(
    feature: QueryEnhancementsFeature,
    logger: Logger,
    handler: RequestHandler<P, Q, B>
  ): RequestHandler<P, Q, B> =>
  async (context, request, response) => {
    let enabled = false;
    try {
      enabled = await isFeatureEnabled(
        context.core.dynamicConfig.client,
        feature,
        context.core.dynamicConfig.asyncLocalStore
      );
    } catch (error) {
      logger.error(`Failed to resolve the ${feature} feature flag, denying the request`, error);
    }

    if (!enabled) {
      return response.forbidden({ body: FEATURE_DISABLED_MESSAGE });
    }

    return handler(context, request, response);
  };
