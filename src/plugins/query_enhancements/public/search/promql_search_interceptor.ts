/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import {
  API,
  ASSUMED_SCRAPE_INTERVAL,
  calculateStep,
  DEFAULT_RESOLUTION,
  EnhancedFetchContext,
  fetch,
  interpolatePromQLMacros,
  MIN_STEP_INTERVAL,
  parseStepIntervalSeconds,
  PromQLMacroContext,
  PromQLQuery,
  SEARCH_STRATEGY,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

interface Bounds {
  min?: { valueOf(): number };
  max?: { valueOf(): number };
}

export function resolvePromQLMacroContext(
  query: PromQLQuery,
  bounds: Bounds
): PromQLMacroContext | undefined {
  const min = bounds.min?.valueOf();
  const max = bounds.max?.valueOf();
  if (min === undefined || max === undefined || max <= min) return undefined;

  const { maxDataPoints, minStep } = query;
  const resolution = maxDataPoints && maxDataPoints > 0 ? maxDataPoints : DEFAULT_RESOLUTION;
  const parsedMinStep = minStep ? parseStepIntervalSeconds(minStep) : undefined;
  const minStepSec = parsedMinStep && parsedMinStep > 0 ? parsedMinStep : undefined;

  return {
    stepSec: calculateStep(max - min, resolution, minStepSec ?? MIN_STEP_INTERVAL),
    rangeMs: max - min,
    scrapeSec: minStepSec ?? ASSUMED_SCRAPE_INTERVAL,
  };
}

export function resolveStepOptions(
  query: PromQLQuery,
  bounds: Bounds,
  ctx: PromQLMacroContext | undefined = resolvePromQLMacroContext(query, bounds)
): { step: number } | undefined {
  if (query.maxDataPoints === undefined && query.minStep === undefined) return undefined;
  return ctx ? { step: ctx.stepSec } : undefined;
}

export class PromQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([_coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
    });
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const timefilter = this.queryService.timefilter.timefilter;
    const queryState: PromQLQuery = this.queryService.queryString.getQuery();
    const bounds = timefilter.getBounds();
    const macroContext = resolvePromQLMacroContext(queryState, bounds);
    const stepOptions = resolveStepOptions(queryState, bounds, macroContext);

    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${SEARCH_STRATEGY.PROMQL}`),
      signal: options.abortSignal,
      body: {
        timeRange: timefilter.getTime(),
        ...(stepOptions ? { options: stepOptions } : {}),
      },
    };

    // Extract the query from the request if available, otherwise fall back to global query service
    let query: PromQLQuery = queryState;
    if (request.params?.body?.query?.queries && request.params.body.query.queries.length > 0) {
      query = request.params.body.query.queries[0];
    }

    if (queryState.legendFormat !== undefined) {
      query = { ...query, legendFormat: queryState.legendFormat };
    }

    if (macroContext && typeof query.query === 'string') {
      query = { ...query, query: interpolatePromQLMacros(query.query, macroContext) };
    }

    return fetch(context, query);
  }
}
