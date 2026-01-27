/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFormFieldset, EuiTitle, EuiButtonGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export const IMPORT_CHOICE_TEXT = 'text';
export const IMPORT_CHOICE_FILE = 'file';
export type ImportChoices = typeof IMPORT_CHOICE_TEXT | typeof IMPORT_CHOICE_FILE;

export interface ImportTypeSelectorProps {
  updateSelection: (selection: ImportChoices) => void;
  initialSelection?: ImportChoices;
}

export const ImportTypeSelector = ({
  updateSelection,
  initialSelection,
}: ImportTypeSelectorProps) => {
  const [importType, setImportType] = useState(initialSelection || IMPORT_CHOICE_FILE);

  const onChange = (choice: string) => {
    setImportType(choice as ImportChoices);
    updateSelection(choice as ImportChoices);
  };

  const toggleButtons = [
    {
      id: IMPORT_CHOICE_FILE,
      label: i18n.translate('dataImporter.file.upload', {
        defaultMessage: 'Upload',
      }),
    },
    {
      id: IMPORT_CHOICE_TEXT,
      label: i18n.translate('dataImporter.text', {
        defaultMessage: 'Text',
      }),
    },
  ];

  return (
    <EuiFormFieldset
      legend={{
        children: (
          <EuiTitle size="xs">
            <span>
              {i18n.translate('dataImporter.importType', {
                defaultMessage: 'Import type',
              })}
            </span>
          </EuiTitle>
        ),
      }}
    >
      <EuiButtonGroup
        legend={i18n.translate('dataImporter.importType', {
          defaultMessage: 'Import type',
        })}
        options={toggleButtons}
        idSelected={importType}
        onChange={onChange}
        buttonSize="m"
        isFullWidth
      />
    </EuiFormFieldset>
  );
};
