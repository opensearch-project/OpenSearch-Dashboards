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
    const urlContainerState = osdUrlStateStorage?.get<ContainerState>(CONTAINER_URL_KEY);

    const incomingStates = embeddable.getStateTransfer(scopedHistory).getIncomingEditorState();
    const originatingAppFromEmbeddable = incomingStates?.originatingApp;
    const containerInfoFromEmbeddable = incomingStates?.containerInfo;
    const newState = {
      originatingApp: originatingAppFromEmbeddable,
      containerInfo: containerInfoFromEmbeddable,
      ...(urlContainerState ?? {}),
    };

    if (osdUrlStateStorage)
      osdUrlStateStorage?.set<ContainerState>(CONTAINER_URL_KEY, newState, { replace: true });

    setContext(newState);
  }, []);

  return { context };
};
