/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, PropsWithChildren, useState } from 'react';

interface CelestialStateContextType {
  selectedNodeId?: string;
  setSelectedNodeId: (id: string | undefined) => void;
  unstackedAggregateNodeIds: string[];
  setUnstackedAggregateNodeIds: (ids: string[]) => void;
  activeMenuNodeId: string | null;
  setActiveMenuNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Initialize with undefined instead of a default object
const CelestialStateContext = createContext<CelestialStateContextType | undefined>(undefined);

export interface CelestialStateProviderProps {
  // Make mocks optional since it's used for testing only
  mocks?: CelestialStateContextType;
}

export const CelestialStateProvider: React.FC<PropsWithChildren<CelestialStateProviderProps>> = ({
  children,
  mocks,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [unstackedAggregateNodeIds, setUnstackedAggregateNodeIds] = useState<string[]>([]);

  return (
    <CelestialStateContext.Provider
      value={
        mocks ?? {
          selectedNodeId,
          setSelectedNodeId,
          unstackedAggregateNodeIds,
          setUnstackedAggregateNodeIds,
          activeMenuNodeId,
          setActiveMenuNodeId,
        }
      }
    >
      {children}
    </CelestialStateContext.Provider>
  );
};

export const useCelestialStateContext = () => {
  const context = useContext(CelestialStateContext);
  if (context === undefined) {
    throw new Error('useCelestialStateContext must be used within a CelestialStateProvider');
  }
  return context;
};
