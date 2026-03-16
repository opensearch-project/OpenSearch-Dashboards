/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MountPoint } from 'opensearch-dashboards/public';
import React, { createContext, useContext, FC, ReactNode } from 'react';

interface InContextEditorContextValue {
  exploreId?: string;
  containerId?: string;
  isInContextEditor: boolean;
  setHeaderActionMenu?: (menuMount: MountPoint | undefined) => void;
}

const InContextEditorContext = createContext<InContextEditorContextValue>({
  isInContextEditor: false,
});

interface InContextEditorProviderProps {
  exploreId?: string;
  containerId?: string;
  children: ReactNode;
  setHeaderActionMenu?: (menuMount: MountPoint | undefined) => void;
}

export const InContextEditorProvider: FC<InContextEditorProviderProps> = ({
  exploreId,
  containerId,
  children,
  setHeaderActionMenu,
}) => {
  const value: InContextEditorContextValue = {
    exploreId,
    containerId,
    isInContextEditor: true,
    setHeaderActionMenu,
  };

  return (
    <InContextEditorContext.Provider value={value}>{children}</InContextEditorContext.Provider>
  );
};

export const useInContextEditor = (): InContextEditorContextValue => {
  return useContext(InContextEditorContext);
};
