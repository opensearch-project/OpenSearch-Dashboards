/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FC, ReactNode } from 'react';
import { ContainerInfo } from '../../../application/in_context_vis_editor/utils';

interface VisualizationEditorContextValue {
  originatingApp?: string;
  containerInfo?: ContainerInfo;
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
