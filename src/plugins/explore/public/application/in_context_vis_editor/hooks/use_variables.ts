/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect, useRef } from 'react';
import { BehaviorSubject } from 'rxjs';
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

/**
 * Hook that creates a standalone VariableService and manages
 * all variable-related side effects (refresh, interpolation, re-execution).
 *
 * Returns `variableService` for rendering VariablesBar.
 */
export const useVariables = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder } = useQueryBuilderState();
  const initialVariables = services.dashboard?.getActiveVariables?.();

  // Create service & interpolation
  const variableService = useMemo(() => {
    if (!initialVariables || initialVariables.length === 0) return undefined;

    const svc = new VariableService(services.data);
    const input$ = new BehaviorSubject<{ variables?: Variable[] }>({
      variables: initialVariables,
    });
    svc.connect(
      (updates) => input$.next({ ...input$.getValue(), ...updates }),
      () => input$.getValue(),
      () => input$
    );
    return svc;
  }, [initialVariables, services.data]);

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

  useEffect(() => {
    return () => variableService?.destroy();
  }, [variableService]);

  return { variableService };
};
