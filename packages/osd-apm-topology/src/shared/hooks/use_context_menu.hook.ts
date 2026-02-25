/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';

interface UseContextMenuProps {
  id: string;
  nodeRef: MutableRefObject<HTMLDivElement | null>;
  activeMenuNodeId?: string | null;
  setActiveMenuNodeId?: (id: string | null) => void;
}

export const useContextMenu = ({
  id,
  nodeRef,
  activeMenuNodeId,
  setActiveMenuNodeId,
}: UseContextMenuProps) => {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMenuOpen = activeMenuNodeId === id;

  const onClose = useCallback(() => {
    setActiveMenuNodeId?.(null);
  }, [setActiveMenuNodeId]);

  const onToggleMenu = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setActiveMenuNodeId?.(isMenuOpen ? null : id);
    },
    [id, isMenuOpen, setActiveMenuNodeId]
  );

  useEffect(() => {
    if (isMenuOpen && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 4,
      });
    }
  }, [isMenuOpen, nodeRef]);

  return { isMenuOpen, menuPosition, menuRef, onToggleMenu, onClose };
};
