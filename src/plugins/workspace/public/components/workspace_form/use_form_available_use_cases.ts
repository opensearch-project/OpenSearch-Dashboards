/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { ALL_USE_CASE_ID } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { AvailableUseCaseItem } from './types';

interface UseFormAvailableUseCasesOptions {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const useFormAvailableUseCases = ({
  registeredUseCases$,
}: UseFormAvailableUseCasesOptions) => {
  const registeredUseCases = useObservable(registeredUseCases$, undefined);

  const availableUseCases = useMemo<AvailableUseCaseItem[] | undefined>(() => {
    if (!registeredUseCases) {
      return undefined;
    }
    return registeredUseCases.filter(
      (useCase) => !useCase.systematic || useCase.id === ALL_USE_CASE_ID
    );
  }, [registeredUseCases]);

  return {
    availableUseCases,
  };
};
