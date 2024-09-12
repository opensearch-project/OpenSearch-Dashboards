/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiSmallButtonIcon,
  EuiDraggable,
  EuiDroppable,
  EuiCompressedFormRow,
  EuiPanel,
  EuiText,
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
  limit = 1,
  isValidDropTarget,
  canDrop,
  dropProps,
  isDragging,
}: DropboxProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [closing, setClosing] = useState<boolean | string>(false);

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
    <EuiCompressedFormRow label={boxLabel} className="dropBox" fullWidth>
      <div className="dropBox__container">
        <EuiDroppable
          className="dropBox__droppable"
          droppableId={dropboxId}
          isCombineEnabled={true}
        >
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
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
                    className={`dropBox__field dropBox__dropTarget ${
                      isDragging ? 'validField' : ''
                    } ${snapshot.isDraggingOver ? 'canDrop' : ''}`}
                    data-test-subj={`dropBoxField-${dropboxId}-${index}`}
                  >
                    <EuiText
                      size="s"
                      className="dropBox__field_text"
                      onClick={() => onEditField(id)}
                    >
                      <a role="button" tabIndex={0}>
                        {label}
                      </a>
                    </EuiText>
                    <EuiSmallButtonIcon
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
            </div>
          )}
        </EuiDroppable>
        <EuiDroppable droppableId={`AddPanel_${dropboxId}`}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {fields.length < limit && (
                <EuiPanel
                  data-test-subj={`dropBoxAddField-${dropboxId}`}
                  className={`dropBox__field dropBox__dropTarget ${
                    isDragging ? 'validField' : ''
                  } ${snapshot.isDraggingOver ? 'canDrop' : ''}`}
                  {...(isValidDropTarget && dropProps)}
                >
                  <EuiText size="s">
                    {i18n.translate('visBuilder.dropbox.addField.title', {
                      defaultMessage: 'Click or drop to add',
                    })}
                  </EuiText>
                  <EuiSmallButtonIcon
                    iconType="plusInCircle"
                    aria-label="clear-field"
                    iconSize="s"
                    onClick={() => onAddField()}
                    data-test-subj="dropBoxAddBtn"
                  />
                </EuiPanel>
              )}
            </div>
          )}
        </EuiDroppable>
      </div>
    </EuiCompressedFormRow>
  );
};

const Dropbox = React.memo((dropBox: UseDropboxProps) => {
  const props = useDropbox(dropBox);
  return <DropboxComponent {...props} />;
});

export { Dropbox, DropboxComponent, DropboxProps };
