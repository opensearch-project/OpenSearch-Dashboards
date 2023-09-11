/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFormFieldset, EuiTitle, EuiRadioGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface ImportModeControlProps {
  initialValues: ImportMode;
  updateSelection: (result: ImportMode) => void;
}

export interface ImportMode {
  overwrite: boolean;
}

const overwriteEnabled = {
  id: 'overwriteEnabled',
  label: i18n.translate('console.importModeControl.overwrite.enabledLabel', {
    defaultMessage: 'Overwrite existing queries',
  }),
};
const overwriteDisabled = {
  id: 'overwriteDisabled',
  label: i18n.translate('console.importModeControl.overwrite.disabledLabel', {
    defaultMessage: 'Merge with existing queries',
  }),
};
const importOptionsTitle = i18n.translate('console.importModeControl.importOptionsTitle', {
  defaultMessage: 'Import options',
});

export const ImportModeControl = ({ initialValues, updateSelection }: ImportModeControlProps) => {
  const [overwrite, setOverwrite] = useState(initialValues.overwrite);

  const onChange = (partial: Partial<ImportMode>) => {
    if (partial.overwrite !== undefined) {
      setOverwrite(partial.overwrite);
    }
    updateSelection({ overwrite, ...partial });
  };

  const overwriteRadio = (
    <EuiRadioGroup
      options={[overwriteDisabled, overwriteEnabled]}
      idSelected={overwrite ? overwriteEnabled.id : overwriteDisabled.id}
      onChange={(id: string) => onChange({ overwrite: id === overwriteEnabled.id })}
    />
  );

  return (
    <EuiFormFieldset
      legend={{
        children: (
          <EuiTitle size="xs">
            <span>{importOptionsTitle}</span>
          </EuiTitle>
        ),
      }}
    >
      {overwriteRadio}
    </EuiFormFieldset>
  );
};
