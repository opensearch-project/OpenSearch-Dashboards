/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiFieldText, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { VariableWithState } from '../../../variables/types';
import './variable_selector.scss';

export interface TextValueEditorProps {
  variable: VariableWithState;
  onValuesChange: (variableId: string, values: string[]) => void;
}

/**
 * Free-text input for Text-type variables.
 * Commits the value on blur or Enter so dependent query variables
 * only re-run once the user has finished typing.
 */
export const TextValueEditor: React.FC<TextValueEditorProps> = ({ variable, onValuesChange }) => {
  const committedValue = variable.current?.[0] ?? '';
  const [draft, setDraft] = useState(committedValue);

  useEffect(() => {
    setDraft(committedValue);
  }, [committedValue]);

  const commit = useCallback(() => {
    if (draft !== committedValue) {
      onValuesChange(variable.id, draft ? [draft] : []);
    }
  }, [draft, committedValue, variable.id, onValuesChange]);

  const displayLabel = variable.label || variable.name;
  // Base width on the committed value, not the in-progress draft — sizing off
  // draft would make the box jitter on every keystroke.
  const calculatedWidth = Math.max(
    120,
    Math.min(Math.max(committedValue.length, displayLabel.length) * 8 + 40, 400)
  );

  return (
    <EuiToolTip content={variable.description} position="bottom">
      <div
        className="variableSelectorContainer"
        data-label={displayLabel}
        data-test-subj={`variable-${variable.name}`}
        style={{ width: `${calculatedWidth}px` }}
      >
        <EuiFieldText
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
            }
          }}
          placeholder={i18n.translate('dashboard.variables.textInputPlaceholder', {
            defaultMessage: 'Enter value...',
          })}
          data-test-subj="variable-text-input"
          className="variableTextInput"
          compressed
          controlOnly
        />
      </div>
    </EuiToolTip>
  );
};
