/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiPanel, EuiText, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { FieldIconProps, FieldIcon } from '../../../../../../../opensearch_dashboards_react/public';
import { useDrop } from '../../../../utils/drag_drop';
import { FieldDragDataType } from '../../../../utils/drag_drop/types';

import './droppable_box.scss';

export interface DropboxFields {
  label: string;
  icon: FieldIconProps['type'];
  id: string;
}

export interface DroppableBoxProps {
  label: string;
  fields: DropboxFields[];
  limit?: number;
  onAddField: () => void;
  onEditField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onDropField: (data: FieldDragDataType['value']) => void;
}

export const DroppableBox = ({
  label: boxLabel,
  fields,
  onAddField,
  onDeleteField,
  onDropField,
  onEditField,
  limit = 1,
}: DroppableBoxProps) => {
  const [dropProps, { isValidDropTarget }] = useDrop('field-data', onDropField);

  return (
    <EuiFormRow label={boxLabel} className="dropBox" fullWidth>
      <div className="dropBox__container">
        {fields.map(({ id, label, icon }, index) => (
          <EuiPanel key={index} paddingSize="s" className="dropBox__field">
            <FieldIcon type={icon} />
            <EuiText size="s" onClick={() => onEditField(id)}>
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
        ))}
        {fields.length < limit && (
          <EuiPanel
            className={`dropBox__field dropBox__dropTarget ${
              isValidDropTarget && 'validDropTarget'
            }`}
            {...dropProps}
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
  );
};
