/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { FieldSelectionContext } from '../../types/smart_actions';

export interface SmartActionMenuState {
  isOpen: boolean;
  fieldContext: FieldSelectionContext | null;
  position: { x: number; y: number };
}

export interface UseSmartActionMenuReturn {
  menuState: SmartActionMenuState;
  openMenu: (fieldContext: FieldSelectionContext, position: { x: number; y: number }) => void;
  closeMenu: () => void;
}

const initialState: SmartActionMenuState = {
  isOpen: false,
  fieldContext: null,
  position: { x: 0, y: 0 },
};

export const useSmartActionMenu = (): UseSmartActionMenuReturn => {
  const [menuState, setMenuState] = useState<SmartActionMenuState>(initialState);

  const openMenu = useCallback(
    (fieldContext: FieldSelectionContext, position: { x: number; y: number }) => {
      setMenuState({
        isOpen: true,
        fieldContext,
        position,
      });
    },
    []
  );

  const closeMenu = useCallback(() => {
    setMenuState(initialState);
  }, []);

  return {
    menuState,
    openMenu,
    closeMenu,
  };
};
