/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiFormRow,
  EuiPanel,
  EuiText,
  euiDragDropReorder,
} from '@elastic/eui';
import React, { useCallback } from 'react';
import { FieldIcon } from '../../../../../../../opensearch_dashboards_react/public';
import { IDropAttributes, IDropState } from '../../../../utils/drag_drop';
import './dropbox.scss';
import { DropboxContribution, DropboxDisplay } from './types';
import { useDropbox } from './use';

interface DropboxProps extends IDropState {
  id: string;
  label: string;
  fields: DropboxDisplay[];
  limit?: number;
  onAddField: () => void;
  onEditField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onReorderField: (reorderedIds: string[]) => void;
  dropProps: IDropAttributes;
}

const DropboxComponent = ({
  id: dropboxId,
  label: boxLabel,
  fields,
  onAddField,
  onDeleteField,
  onEditField,
  onReorderField,
  limit = 1,
  isValidDropTarget,
  canDrop,
  dropProps,
}: DropboxProps) => {
  const handleDragEnd = useCallback(
    ({ source, destination }) => {
      if (!source || !destination) return;

      const instanceIds = fields.map(({ id }) => id);
      const reorderedIds = euiDragDropReorder(instanceIds, source.index, destination.index);

      onReorderField(reorderedIds);
    },
    [fields, onReorderField]
  );

  return (
    <EuiDragDropContext onDragEnd={handleDragEnd}>
      <EuiFormRow label={boxLabel} className="dropBox" fullWidth>
        <div className="dropBox__container">
          <EuiDroppable droppableId={dropboxId}>
            {fields.map(({ id, label, icon }, index) => (
              <EuiDraggable className="dropBox__draggable" key={id} draggableId={id} index={index}>
                <EuiPanel key={index} paddingSize="s" className="dropBox__field">
                  <FieldIcon type={icon} />
                  <EuiText size="s" className="dropBox__field_text" onClick={() => onEditField(id)}>
                    <a role="button" tabIndex={0}>
                      {label}
                    </a>
                  </EuiText>
                  <EuiButtonIcon
                    color="subdued"
                    iconType="cross"
                    aria-label="clear-field"
                    iconSize="s"
                    onClick={() => onDeleteField(id)}
                  />
                </EuiPanel>
              </EuiDraggable>
            ))}
          </EuiDroppable>
          {fields.length < limit && (
            <EuiPanel
              className={`dropBox__field dropBox__dropTarget ${
                isValidDropTarget ? 'validField' : ''
              } ${canDrop ? 'canDrop' : ''}`}
              {...(isValidDropTarget && dropProps)}
            >
              <EuiText size="s">Click or drop to add</EuiText>
              <EuiButtonIcon
                iconType="plusInCircle"
                aria-label="clear-field"
                iconSize="s"
                onClick={() => onAddField()}
              />
            </EuiPanel>
          )}
        </div>
      </EuiFormRow>
    </EuiDragDropContext>
  );
};

const Dropbox = React.memo((dropBox: DropboxContribution) => {
  const props = useDropbox(dropBox);

  return <DropboxComponent {...props} />;
});

export { Dropbox, DropboxComponent, DropboxProps };
