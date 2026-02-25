/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface MenuPosition {
  top: number;
  left: number;
}

interface MenuContextType {
  activeMenuNodeId: string | null;
  setActiveMenuNodeId: (id: string | null) => void;
  menuPosition: MenuPosition | null;
  registerNodeRef: (id: string, ref: React.RefObject<HTMLDivElement>) => void;
  onToggleMenu: (event: React.MouseEvent, nodeId: string) => void;
  isMenuOpen: (nodeId: string) => boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const nodeRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

  const registerNodeRef = (id: string, ref: React.RefObject<HTMLDivElement>) => {
    nodeRefs.current[id] = ref;
  };

  const onToggleMenu = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    if (activeMenuNodeId === nodeId) {
      setActiveMenuNodeId(null);
    } else {
      setActiveMenuNodeId(nodeId);
    }
  };

  const isMenuOpen = (nodeId: string) => activeMenuNodeId === nodeId;

  useEffect(() => {
    if (activeMenuNodeId && nodeRefs.current[activeMenuNodeId]?.current) {
      const rect = nodeRefs.current[activeMenuNodeId].current!.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 4, // keep it to the right of the node
      });
    }
  }, [activeMenuNodeId]);

  return (
    <MenuContext.Provider
      value={{
        activeMenuNodeId,
        setActiveMenuNodeId,
        menuPosition,
        registerNodeRef,
        onToggleMenu,
        isMenuOpen,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};
