/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FC, ReactNode } from 'react';

interface VisualizationEditorContextValue {
  originatingApp?: string;
  containerInfo?: ContainerInfo;
}

interface ContainerInfo {
  containerName?: string;
  containerId?: string;
}

const VisualizationEditorContext = createContext<VisualizationEditorContextValue>({});

interface VisualizationEditorProviderProps {
  originatingApp?: string;
  containerInfo?: ContainerInfo;
  children: ReactNode;
}

export const VisualizationEditorProvider: FC<VisualizationEditorProviderProps> = ({
  originatingApp,
  containerInfo,
  children,
}) => {
  const value: VisualizationEditorContextValue = {
    originatingApp,
    containerInfo,
  };

  return (
    <VisualizationEditorContext.Provider value={value}>
      {children}
    </VisualizationEditorContext.Provider>
  );
};

export const useVisualizationEditor = (): VisualizationEditorContextValue => {
  return useContext(VisualizationEditorContext);
};
