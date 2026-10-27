/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect } from 'react';
import { EMPTY } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  Variable,
  VariableService,
  VariableInterpolationService,
  createNoOpVariableInterpolationService,
  hasLoadingVariables,
} from '../../../../../dashboard/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useQueryBuilderState } from './use_query_builder_state';
import { useVisualizationBuilder } from './use_visualization_builder';
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
  const { visualizationBuilderForEditor } = useVisualizationBuilder();

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
    const svc = new VariableInterpolationService(() => variableService.getVariablesWithState());
    variableService.setInterpolationService(svc);
    return svc;
  }, [variableService]);

  // Wire interpolation service into queryBuilder
  useEffect(() => {
    if (interpolationService) {
      queryBuilder.setInterpolationService(interpolationService);
    }
  }, [queryBuilder, interpolationService]);

  // Refresh variable options whenever their queries or the time range change.
  useEffect(() => {
    if (!variableService) return;
    const { timefilter } = services.data.query.timefilter;
    return variableService.startRefreshScheduler({
      time$: timefilter.getTimeUpdate$().pipe(
        map(() => timefilter.getTime()),
        startWith(timefilter.getTime())
      ),
      // The editor's run button only re-runs the panel query; time changes
      // still refresh the variables through time$.
      reload$: EMPTY,
    });
  }, [variableService, services.data]);

  // When values settle: give the table preview the values for its data links,
  // and re-execute the query if its interpolated form changed
  useEffect(() => {
    if (!variableService || !interpolationService) return;

    const sub = variableService.getVariables$().subscribe((variables) => {
      if (hasLoadingVariables(variables)) return;

      visualizationBuilderForEditor.setVariables(interpolationService.getVariables());

      const queryState = queryBuilder.queryState$.getValue();
      const currentQuery = prepareQueryForLanguage(queryState).query;
      if (!currentQuery || !interpolationService.hasVariables(currentQuery)) return;

      const interpolated = interpolationService.interpolate(currentQuery, queryState.language);
      if (interpolated === queryBuilder.lastExecutedInterpolatedQuery) return;

      queryBuilder.executeQuery();
    });

    return () => sub.unsubscribe();
  }, [variableService, interpolationService, queryBuilder, visualizationBuilderForEditor]);

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
