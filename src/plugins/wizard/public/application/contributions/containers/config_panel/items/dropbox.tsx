/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFormRow, EuiPanel, EuiText } from '@elastic/eui';
import React from 'react';
import { FieldIcon } from '../../../../../../../opensearch_dashboards_react/public';
import { IDropAttributes, IDropState } from '../../../../utils/drag_drop';
import './dropbox.scss';
import { DropboxContribution, DropboxField } from './types';
import { useDropbox } from './use';

interface DropboxProps extends IDropState {
  label: string;
  fields: DropboxField[];
  limit?: number;
  onAddField: () => void;
  onEditField: (id: string) => void;
  onDeleteField: (id: string) => void;
  dropProps: IDropAttributes;
}

const DropboxComponent = ({
  label: boxLabel,
  fields,
  onAddField,
  onDeleteField,
  onEditField,
  limit = 1,
  isValidDropTarget,
  canDrop,
  dropProps,
}: DropboxProps) => {
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
  );
};

const Dropbox = React.memo((dropBox: DropboxContribution) => {
  const props = useDropbox(dropBox);

  return <DropboxComponent {...props} />;
});

export { Dropbox, DropboxComponent, DropboxProps };
