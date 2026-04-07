/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { getServices } from '../../../services/services';
import { ContainerState, CONTAINER_URL_KEY } from '../utils';

export const useInitialContainerContext = () => {
  const [context, setContext] = useState<ContainerState>({
    originatingApp: undefined,
    containerInfo: undefined,
  });

  useEffect(() => {
    const services = getServices();
    const { osdUrlStateStorage, embeddable, scopedHistory } = services;

    const incomingStates = embeddable.getStateTransfer(scopedHistory).getIncomingEditorState();
    const hasIncomingStates = incomingStates?.originatingApp || incomingStates?.containerInfo;
    if (hasIncomingStates) {
      // has incoming states from state transfer: use it and update URL
      const stateFromTransfer: ContainerState = {
        originatingApp: incomingStates.originatingApp,
        containerInfo: incomingStates.containerInfo,
      };

      if (osdUrlStateStorage) {
        osdUrlStateStorage.set<ContainerState>(CONTAINER_URL_KEY, stateFromTransfer, {
          replace: true,
        });
      }

      setContext(stateFromTransfer);
    } else {
      // No incoming states from state transfer: use URL state
      const urlContainerState = osdUrlStateStorage?.get<ContainerState>(CONTAINER_URL_KEY);

      setContext(
        urlContainerState ?? {
          originatingApp: undefined,
          containerInfo: undefined,
        }
      );
    }
  }, []);

  return { context };
};
