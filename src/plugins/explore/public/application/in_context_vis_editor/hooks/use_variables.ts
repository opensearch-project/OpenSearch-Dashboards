/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect, useRef } from 'react';
import {
  Variable,
  VariableService,
  VariableInterpolationService,
  createNoOpVariableInterpolationService,
} from '../../../../../dashboard/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useQueryBuilderState } from './use_query_builder_state';
import { prepareQueryForLanguage } from '../../utils/languages';
import { VARIABLE_VALUES_URL_KEY } from '../types';

/**
 * Hook that creates a standalone VariableService for in-context editor.
 * Variables are loaded from dashboard saved object via use_initial_container_context.ts
 * and used in read-only mode for query interpolation.
 *
 * Returns `variableService` for rendering VariablesBar.
 * @param containerVariables - Variables from the originating dashboard (loaded from saved object)
 */
export const useVariables = (containerVariables?: Variable[]) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder } = useQueryBuilderState();

  // Create service & interpolation
  const variableService = useMemo(() => {
    if (!containerVariables || containerVariables.length === 0) {
      return undefined;
    }

    const svc = new VariableService(services.data);
    svc.initialize(containerVariables);
    return svc;
  }, [containerVariables, services.data]);

  const interpolationService = useMemo(() => {
    if (!variableService) return createNoOpVariableInterpolationService();
    const svc = new VariableInterpolationService(() => variableService.getVariables());
    variableService.setInterpolationService(svc);
    return svc;
  }, [variableService]);

  // Wire interpolation service into queryBuilder
  useEffect(() => {
    if (interpolationService) {
      queryBuilder.setInterpolationService(interpolationService);
    }
  }, [queryBuilder, interpolationService]);

  // Initial refresh
  const hasRefreshed = useRef(false);
  useEffect(() => {
    if (variableService && !hasRefreshed.current) {
      hasRefreshed.current = true;
      variableService.refreshAllVariableOptions();
    }
  }, [variableService]);

  // Refresh on time range change
  useEffect(() => {
    if (!variableService) return;
    const sub = services.data.query.timefilter.timefilter
      .getTimeUpdate$()
      .subscribe(() => variableService.refreshAllVariableOptions());
    return () => sub.unsubscribe();
  }, [variableService, services.data]);

  // Re-execute query when interpolated result changes
  useEffect(() => {
    if (!variableService || !interpolationService) return;

    const sub = variableService.getVariables$().subscribe((variables: any[]) => {
      if (variables.some((v: any) => 'loading' in v && v.loading)) return;

      const queryState = queryBuilder.queryState$.getValue();
      const currentQuery = prepareQueryForLanguage(queryState).query;
      if (!currentQuery || !interpolationService.hasVariables(currentQuery)) return;

      const interpolated = interpolationService.interpolate(currentQuery, queryState.language);
      if (interpolated === queryBuilder.lastExecutedInterpolatedQuery) return;

      queryBuilder.executeQuery();
    });

    return () => sub.unsubscribe();
  }, [variableService, interpolationService, queryBuilder]);

  // Sync variable values to URL
  useEffect(() => {
    if (!variableService || !services.osdUrlStateStorage) return;

    const sub = variableService.getVariables$().subscribe((variables: Variable[]) => {
      // Skip if variables are still loading
      if (variables.some((v: any) => 'loading' in v && v.loading)) return;

      // Extract current values
      const variableValues: Record<string, string[]> = {};
      variables.forEach((variable) => {
        if (variable.current) {
          variableValues[variable.name] = variable.current;
        }
      });

      // Write to URL
      if (services?.osdUrlStateStorage && Object.keys(variableValues).length > 0) {
        services.osdUrlStateStorage.set(VARIABLE_VALUES_URL_KEY, variableValues, {
          replace: true,
        });
      }
    });

    return () => sub.unsubscribe();
  }, [variableService, services.osdUrlStateStorage]);

  useEffect(() => {
    return () => variableService?.destroy();
  }, [variableService]);

  return { variableService };
};
