/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFormRow, EuiPanel, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import { IndexPatternField } from 'src/plugins/data/common';
import { useDrop } from '../../utils/drag_drop';

import './config_section.scss';

interface ConfigSectionProps {
  id: string;
  title: string;
  onChange: Function;
}

export const ConfigSection = ({ title, id, onChange }: ConfigSectionProps) => {
  const [currentField, setCurrentField] = useState<IndexPatternField>();

  const dropHandler = useCallback((field: IndexPatternField) => {
    setCurrentField(field);
  }, []);
  const [dropProps, { isValidDropTarget, dragData }] = useDrop('dataPlane', dropHandler);

  const dropTargetString = dragData
    ? dragData.type
    : i18n.translate('wizard.nav.dataTab.configPanel.dropTarget.placeholder', {
        defaultMessage: 'Click or drop to add',
      });

  useEffect(() => {
    onChange(id, currentField);
  }, [id, currentField, onChange]);

  return (
    <EuiFormRow label={title} className="wizConfigSection">
      {currentField ? (
        <EuiPanel paddingSize="s" className="wizConfigSection__field">
          <EuiText grow size="m">
            {currentField.displayName}
          </EuiText>
          <EuiButtonIcon
            color="danger"
            iconType="cross"
            aria-label="clear-field"
            onClick={() => setCurrentField(undefined)}
          />
        </EuiPanel>
      ) : (
        <div
          className={`wizConfigSection__dropTarget ${isValidDropTarget && 'validDropTarget'}`}
          {...dropProps}
        >
          <EuiText size="s">{dropTargetString}</EuiText>
        </div>
      )}
    </EuiFormRow>
  );
};
