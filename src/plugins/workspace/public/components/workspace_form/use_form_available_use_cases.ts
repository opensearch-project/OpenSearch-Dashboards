/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { ALL_USE_CASE_ID, DEFAULT_NAV_GROUPS, SavedObjectsStart } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { getIsOnlyAllowEssentialUseCase } from '../../utils';
import { AvailableUseCaseItem } from './types';

interface UseFormAvailableUseCasesOptions {
  onlyAllowEssentialEnabled?: boolean;
  savedObjects?: SavedObjectsStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const useFormAvailableUseCases = ({
  onlyAllowEssentialEnabled = false,
  savedObjects,
  registeredUseCases$,
}: UseFormAvailableUseCasesOptions) => {
  const [isOnlyAllowEssential, setIsOnlyAllowEssential] = useState<boolean>();
  const registeredUseCases = useObservable(registeredUseCases$, undefined);

  useEffect(() => {
    let shouldUpdate = true;
    if (!onlyAllowEssentialEnabled || !savedObjects) {
      return;
    }
    const updateEssential = (payload: boolean) => {
      if (shouldUpdate) {
        setIsOnlyAllowEssential(payload);
      }
    };
    (async () => {
      try {
        const result = await getIsOnlyAllowEssentialUseCase(savedObjects.client);
        updateEssential(result);
      } catch (e) {
        // Set to false if failed to fetch the "only allow essential use case" setting
        updateEssential(false);
      }
    })();
    return () => {
      shouldUpdate = false;
    };
  }, [savedObjects, onlyAllowEssentialEnabled]);

  const availableUseCases = useMemo<AvailableUseCaseItem[] | undefined>(() => {
    if (!registeredUseCases) {
      return undefined;
    }
    if (onlyAllowEssentialEnabled && isOnlyAllowEssential) {
      return registeredUseCases.flatMap((useCase) =>
        useCase.id === DEFAULT_NAV_GROUPS.essentials.id ? [{ ...useCase, disabled: true }] : []
      );
    }
    return registeredUseCases.filter(
      (useCase) => !useCase.systematic || useCase.id === ALL_USE_CASE_ID
    );
  }, [registeredUseCases, isOnlyAllowEssential, onlyAllowEssentialEnabled]);

  return {
    isOnlyAllowEssential,
    availableUseCases,
  };
};
