/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { SectionItem } from './utils';
import './query_workspace.scss';

export interface SectionListItemProps {
  item: SectionItem;
  sectionId: string;
  isActive: boolean;
  // Only toggles the grab icon; the draggable wrapper owns the drag handle.
  showDragHandle?: boolean;
  renderItemActions?: (item: SectionItem) => React.ReactNode;
  onSelectItem: (id: string) => void;
}

/**
 * A single row in a SectionList.
 */
export const SectionListItem = ({
  item,
  sectionId,
  isActive,
  showDragHandle,
  renderItemActions,
  onSelectItem,
}: SectionListItemProps) => (
  <div className="queryWorkspaceSectionItem">
    <div className="queryWorkspaceSectionItem__buttonWrapper">
      <button
        className={[
          // use "osd-resetFocusState" to not apply the default focus state
          'osd-resetFocusState',
          'queryWorkspaceSectionItem__button',
          `queryWorkspaceSectionItem__button--${sectionId}`,
          isActive ? 'queryWorkspaceSectionItem__button-isActive' : '',
          item.isHidden ? 'queryWorkspaceSectionItem__button-isHidden' : '',
          item.isValid === false ? 'queryWorkspaceSectionItem__button-isInvalid' : '',
          item.showStepWarning ? 'queryWorkspaceSectionItem__button-hasWarning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelectItem(item.id)}
        data-test-subj={`sectionListItem-${item.id}`}
      >
        {item.iconType && (
          <EuiIcon type={item.iconType} size="s" className="queryWorkspaceSectionItem__icon" />
        )}
        <span className="queryWorkspaceSectionItem__label">{item.label}</span>
      </button>

      {(renderItemActions || showDragHandle) && (
        <div className="queryWorkspaceSectionItem__actions">
          {renderItemActions?.(item)}

          {showDragHandle && (
            <span
              className="queryWorkspaceSectionItem__dragHandle"
              data-test-subj={`sectionDragHandle-${item.id}`}
            >
              <EuiIcon type="grab" />
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);
