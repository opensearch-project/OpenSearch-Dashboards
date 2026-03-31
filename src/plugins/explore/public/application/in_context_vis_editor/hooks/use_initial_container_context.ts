/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { getServices } from '../../../services/services';
import { ContainerInfo } from '../utils';

const CONTAINER_URL_KEY = '_c';

export interface ContainerState {
  originatingApp: string | undefined;
  containerInfo: ContainerInfo | undefined;
}

export const useInitialContainerContext = () => {
  const services = getServices();

  const { osdUrlStateStorage, embeddable, scopedHistory } = services;

  const [context, setContext] = useState<ContainerState>({
    originatingApp: undefined,
    containerInfo: undefined,
  });

  useEffect(() => {
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
    // only sync once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { context };
};
