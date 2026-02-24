/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useNodeRelationships, Visibility } from '../../shared/hooks/use-node-relationships.hook';
import { t } from '../../shared/i18n/t';
import { useOnClickOutside } from '../../shared/hooks/use-on-click-outside.hook';
import type { ContextMenuProps } from './types';
import { MenuItem } from './MenuItem';
import { useContextMenuActions } from './use-context-menu-actions.hook';

const ContextMenu: React.FC<ContextMenuProps> = ({ nodeId, onClose }) => {
  const menuRef = useRef<HTMLUListElement>(null);

  const { hasOutgoingEdges } = useNodeRelationships();

  // closes menu if user clicks outside of the node
  useOnClickOutside(menuRef, onClose);

  const { onExpandChildren, onCollapseDescendants } = useContextMenuActions(nodeId, onClose);

  return (
    <ul
      ref={menuRef}
      className="osd:absolute osd:z-9999 osd:overflow-visible osd:bg-white osd:border osd:border-gray-200 osd:rounded osd:shadow-md osd:w-60"
    >
      <MenuItem
        label={t('contextMenu.expandDependencies')}
        isDisabled={!hasOutgoingEdges(nodeId, Visibility.Hidden)}
        onClick={onExpandChildren}
      />
      <MenuItem
        label={t('contextMenu.collapseDependencies')}
        isDisabled={!hasOutgoingEdges(nodeId, Visibility.Visible)}
        onClick={onCollapseDescendants}
      />
    </ul>
  );
};
// eslint-disable-next-line import/no-default-export
export default ContextMenu;
