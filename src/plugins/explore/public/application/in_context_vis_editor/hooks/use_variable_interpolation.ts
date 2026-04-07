/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useQueryBuilderState } from './use_query_builder_state';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { VariableService, IVariableInterpolationService } from '../../../../../dashboard/public';
import { prepareQueryForLanguage } from '../../utils/languages';

/**
 * Hook that manages variable-related side effects in the in-context editor.
 */
export const useVariableInterpolation = (
  variableService?: VariableService,
  interpolationService?: IVariableInterpolationService
) => {
  const { queryBuilder } = useQueryBuilderState();
  const { services } = useOpenSearchDashboards<ExploreServices>();

  useEffect(() => {
    if (interpolationService) {
      queryBuilder.setInterpolationService(interpolationService);
    }
  }, [queryBuilder, interpolationService]);

  const hasRefreshed = useRef(false);
  useEffect(() => {
    if (variableService && !hasRefreshed.current) {
      hasRefreshed.current = true;
      variableService.refreshAllVariableOptions();
    }
  }, [variableService]);

  useEffect(() => {
    if (!variableService) return;

    const subscription = services.data.query.timefilter.timefilter
      .getTimeUpdate$()
      .subscribe(() => {
        variableService.refreshAllVariableOptions();
      });

    return () => subscription.unsubscribe();
  }, [variableService, services.data]);

  useEffect(() => {
    if (!variableService || !interpolationService) return;

    const subscription = variableService.getVariables$().subscribe((variables: any[]) => {
      const hasLoadingVariable = variables.some((v: any) => 'loading' in v && v.loading);
      if (hasLoadingVariable) return;

      const queryState = queryBuilder.queryState$.getValue();
      const currentQuery = prepareQueryForLanguage(queryState).query;

      if (!currentQuery || !interpolationService.hasVariables(currentQuery)) return;

      const interpolatedQuery = interpolationService.interpolate(currentQuery, queryState.language);

      if (interpolatedQuery === queryBuilder.lastExecutedInterpolatedQuery) return;

      queryBuilder.executeQuery();
    });

    return () => subscription.unsubscribe();
  }, [variableService, interpolationService, queryBuilder]);
};
