/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, PropsWithChildren, useState } from 'react';
import { useViewInteractionLock } from '../hooks/use-view-interaction-lock.hook';
import type { LayoutOptions } from '../hooks/use-celestial-layout.hook';

interface ViewLock {
  lock: () => void;
  isLocked: () => boolean;
}

interface CelestialStateContextType {
  selectedNodeId?: string;
  setSelectedNodeId: (id: string | undefined) => void;
  unstackedAggregateNodeIds: string[];
  setUnstackedAggregateNodeIds: (ids: string[]) => void;
  activeMenuNodeId: string | null;
  setActiveMenuNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  viewLock: ViewLock;
  layoutOptions?: LayoutOptions;
}

// Initialize with undefined instead of a default object
const CelestialStateContext = createContext<CelestialStateContextType | undefined>(undefined);

export interface CelestialStateProviderProps {
  // Make mocks optional since it's used for testing only
  mocks?: CelestialStateContextType;
  layoutOptions?: LayoutOptions;
}

export const CelestialStateProvider: React.FC<PropsWithChildren<CelestialStateProviderProps>> = ({
  children,
  mocks,
  layoutOptions,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [unstackedAggregateNodeIds, setUnstackedAggregateNodeIds] = useState<string[]>([]);
  const viewLock = useViewInteractionLock();

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
          viewLock,
          layoutOptions,
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
