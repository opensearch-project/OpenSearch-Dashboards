/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flushSync } from 'react-dom';
import {
  EuiAccordion,
  EuiButtonIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiTitle,
} from '@elastic/eui';
import { Section } from './utils';
import { SectionListItem } from './section_list_item';
import './query_workspace.scss';

export interface SectionListProps {
  section: Section;
  activeItemId?: string;
  onSelectItem: (id: string) => void;
}

/**
 * SectionList for each group (Query or Transformation).
 */
export const SectionList = ({ section, activeItemId, onSelectItem }: SectionListProps) => {
  const { id, title, items, renderAddAction, onAdd, draggable, onReorder, renderItemActions } =
    section;

  const onDragEnd = ({
    source,
    destination,
  }: {
    source: { index: number };
    destination?: { index: number } | null;
  }) => {
    if (!source || !destination || !onReorder) return;
    // React 18 batches this update; flush it so the new order is rendered before
    // react-beautiful-dnd clears its drop transforms (otherwise the old order flickers).
    flushSync(() => onReorder(source.index, destination.index));
  };

  return (
    <div className="queryWorkspaceSection" data-test-subj={`section-${id}`}>
      <EuiAccordion
        id={`queryWorkspaceSectionAccordion-${id}`}
        initialIsOpen
        buttonContent={
          <EuiTitle size="xxs">
            <h4>{title}</h4>
          </EuiTitle>
        }
        extraAction={
          <>
            {renderAddAction}
            {!renderAddAction && onAdd && (
              <EuiButtonIcon
                iconType="plus"
                color="text"
                aria-label={`Add to ${title}`}
                onClick={onAdd}
                className="queryWorkspaceSection__addButton"
                data-test-subj={`sectionAddButton-${id}`}
              />
            )}
          </>
        }
      >
        <div className="queryWorkspaceSection__items">
          {draggable ? (
            <EuiDragDropContext onDragEnd={onDragEnd}>
              <EuiDroppable droppableId={`sectionDroppable-${id}`}>
                {items.map((item, index) => (
                  // Whole row is the drag handle (no customDragHandle). rbd blocks drags that
                  // start on a <button> by default, so interactive-element blocking is disabled;
                  // clicks still select because a drag only starts after ~5px of movement.
                  <EuiDraggable
                    spacing="s"
                    key={item.id}
                    index={index}
                    draggableId={item.id}
                    // customDragHandle
                    disableInteractiveElementBlocking
                  >
                    {() => (
                      <SectionListItem
                        item={item}
                        sectionId={id}
                        isActive={activeItemId === item.id}
                        showDragHandle
                        renderItemActions={renderItemActions}
                        onSelectItem={onSelectItem}
                      />
                    )}
                  </EuiDraggable>
                ))}
              </EuiDroppable>
            </EuiDragDropContext>
          ) : (
            items.map((item) => (
              <SectionListItem
                key={item.id}
                item={item}
                sectionId={id}
                isActive={activeItemId === item.id}
                renderItemActions={renderItemActions}
                onSelectItem={onSelectItem}
              />
            ))
          )}
        </div>
      </EuiAccordion>
    </div>
  );
};
