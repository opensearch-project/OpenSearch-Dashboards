/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import {
  Variable,
  VariableService,
  VariableInterpolationService,
  IVariableInterpolationService,
  createNoOpVariableInterpolationService,
} from '../../../../../dashboard/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

/**
 * Hook that creates a standalone VariableService for the in-context editor.
 * Reads the active dashboard variables from DashboardStart.getActiveVariables().
 */
export const useVariableService = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const initialVariables = services.dashboard?.getActiveVariables?.();

  const variableService = useMemo(() => {
    if (!initialVariables || initialVariables.length === 0) {
      return undefined;
    }

    const service = new VariableService(services.data);
    const input$ = new BehaviorSubject<{ variables?: Variable[] }>({
      variables: initialVariables,
    });

    service.connect(
      (updates) => {
        const current = input$.getValue();
        input$.next({ ...current, ...updates });
      },
      () => input$.getValue(),
      () => input$
    );

    return service;
  }, [initialVariables, services.data]);

  const interpolationService: IVariableInterpolationService = useMemo(() => {
    if (!variableService) {
      return createNoOpVariableInterpolationService();
    }
    const svc = new VariableInterpolationService(() => variableService.getVariables());
    variableService.setInterpolationService(svc);
    return svc;
  }, [variableService]);

  useEffect(() => {
    return () => {
      variableService?.destroy();
    };
  }, [variableService]);

  return { variableService, interpolationService };
};
