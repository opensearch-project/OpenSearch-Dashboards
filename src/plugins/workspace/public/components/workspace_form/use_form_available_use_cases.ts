/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { ALL_USE_CASE_ID, SavedObjectsStart, UseCaseId } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { areAllDataSourcesOpenSearchServerless } from '../../utils';
import { AvailableUseCaseItem } from './types';
import { UseCaseService } from '../../services';

interface UseFormAvailableUseCasesOptions {
  savedObjects?: SavedObjectsStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  useCaseService: UseCaseService;
}

export const useFormAvailableUseCases = ({
  savedObjects,
  registeredUseCases$,
  useCaseService,
}: UseFormAvailableUseCasesOptions) => {
  const [areAllDatasourcesServerless, setAreAllDatasourcesServerless] = useState(false);
  const registeredUseCases = useObservable(registeredUseCases$, undefined);

  useEffect(() => {
    let shouldUpdate = true;
    if (!savedObjects) {
      return;
    }
    const updateEssential = (payload: boolean) => {
      if (shouldUpdate) {
        setAreAllDatasourcesServerless(payload);
      }
    };
    (async () => {
      try {
        const result = await areAllDataSourcesOpenSearchServerless(savedObjects.client);
        updateEssential(result);
      } catch (e) {
        updateEssential(false);
      }
    })();
    return () => {
      shouldUpdate = false;
    };
  }, [savedObjects]);

  const availableUseCases = useMemo<AvailableUseCaseItem[] | undefined>(() => {
    if (!registeredUseCases) {
      return undefined;
    }
    if (areAllDatasourcesServerless) {
      const useCaseOptionDisabled = useCaseService.supportedUseCasesForServerless.length === 1;
      return registeredUseCases.flatMap((useCase) =>
        useCaseService.supportedUseCasesForServerless.includes(useCase.id as UseCaseId)
          ? [{ ...useCase, disabled: useCaseOptionDisabled }]
          : []
      );
    }
    return registeredUseCases.filter(
      (useCase) => !useCase.systematic || useCase.id === ALL_USE_CASE_ID
    );
  }, [
    registeredUseCases,
    areAllDatasourcesServerless,
    useCaseService.supportedUseCasesForServerless,
  ]);

  return {
    availableUseCases,
  };
};
