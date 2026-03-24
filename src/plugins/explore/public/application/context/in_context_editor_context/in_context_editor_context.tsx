/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FC, ReactNode } from 'react';

interface InContextEditorContextValue {
  originatingApp?: string;
}

const InContextEditorContext = createContext<InContextEditorContextValue>({});

interface InContextEditorProviderProps {
  originatingApp?: string;
  children: ReactNode;
}

export const InContextEditorProvider: FC<InContextEditorProviderProps> = ({
  originatingApp,
  children,
}) => {
  const value: InContextEditorContextValue = {
    originatingApp,
  };

  return (
    <InContextEditorContext.Provider value={value}>{children}</InContextEditorContext.Provider>
  );
};

export const useInContextEditor = (): InContextEditorContextValue => {
  return useContext(InContextEditorContext);
};
