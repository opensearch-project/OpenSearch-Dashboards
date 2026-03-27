/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FC, ReactNode } from 'react';

interface VisualizationEditorContextValue {
  originatingApp?: string;
}

const VisualizationEditorContext = createContext<VisualizationEditorContextValue>({});

interface VisualizationEditorProviderProps {
  originatingApp?: string;
  children: ReactNode;
}

export const VisualizationEditorProvider: FC<VisualizationEditorProviderProps> = ({
  originatingApp,
  children,
}) => {
  const value: VisualizationEditorContextValue = {
    originatingApp,
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
