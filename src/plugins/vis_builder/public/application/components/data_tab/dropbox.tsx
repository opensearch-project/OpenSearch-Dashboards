/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiFormRow,
  EuiPanel,
  EuiText,
  DropResult,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import { IDropAttributes, IDropState } from '../../utils/drag_drop';
import './dropbox.scss';
import { useDropbox } from './use';
import { UseDropboxProps } from './use/use_dropbox';
import { usePrefersReducedMotion } from './use/use_prefers_reduced_motion';

export interface DropboxDisplay {
  label: string;
  id: string;
}

interface DropboxProps extends IDropState {
  id: string;
  label: string;
  fields: DropboxDisplay[];
  limit?: number;
  onAddField: () => void;
  onEditField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onReorderField: ({
    sourceAggId,
    destinationAggId,
  }: {
    sourceAggId: string;
    destinationAggId: string;
  }) => void;
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const [closing, setClosing] = useState<boolean | string>(false);
  const handleDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!destination) return;

      onReorderField({
        sourceAggId: fields[source.index].id,
        destinationAggId: fields[destination.index].id,
      });
    },
    [fields, onReorderField]
  );

  const animateDelete = useCallback(
    (id: string) => {
      setClosing(id);
      setTimeout(
        () => {
          onDeleteField(id);
          setClosing(false);
        },
        prefersReducedMotion ? 0 : 350 // Also update speed in dropbox.scss
      );
    },
    [onDeleteField, prefersReducedMotion]
  );

  return (
    <EuiDragDropContext onDragEnd={handleDragEnd}>
      <EuiFormRow label={boxLabel} className="dropBox" fullWidth>
        <div className="dropBox__container">
          <EuiDroppable droppableId={dropboxId}>
            {fields.map(({ id, label }, index) => (
              <EuiDraggable
                className={`dropBox__draggable ${id === closing && 'closing'}`}
                key={id}
                draggableId={id}
                index={index}
              >
                <EuiPanel
                  key={index}
                  paddingSize="s"
                  className="dropBox__field"
                  data-test-subj={`dropBoxField-${dropboxId}-${index}`}
                >
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
                    onClick={() => animateDelete(id)}
                    data-test-subj="dropBoxRemoveBtn"
                  />
                </EuiPanel>
              </EuiDraggable>
            ))}
          </EuiDroppable>
          {fields.length < limit && (
            <EuiPanel
              data-test-subj={`dropBoxAddField-${dropboxId}`}
              className={`dropBox__field dropBox__dropTarget ${
                isValidDropTarget ? 'validField' : ''
              } ${canDrop ? 'canDrop' : ''}`}
              {...(isValidDropTarget && dropProps)}
            >
              <EuiText size="s">
                {i18n.translate('visBuilder.dropbox.addField.title', {
                  defaultMessage: 'Click or drop to add',
                })}
              </EuiText>
              <EuiButtonIcon
                iconType="plusInCircle"
                aria-label="clear-field"
                iconSize="s"
                onClick={() => onAddField()}
                data-test-subj="dropBoxAddBtn"
              />
            </EuiPanel>
          )}
        </div>
      </EuiFormRow>
    </EuiDragDropContext>
  );
};

const Dropbox = React.memo((dropBox: UseDropboxProps) => {
  const props = useDropbox(dropBox);

  return <DropboxComponent {...props} />;
});

export { Dropbox, DropboxComponent, DropboxProps };
