/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState } from 'react';
import {
  EuiFormFieldset,
  EuiTitle,
  EuiCheckableCard,
  EuiCompressedRadioGroup,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface ImportModeControlProps {
  initialValues: ImportMode;
  isLegacyFile: boolean;
  updateSelection: (result: ImportMode) => void;
  optionLabel: string;
  useUpdatedUX?: boolean;
}

export interface ImportMode {
  createNewCopies: boolean;
  overwrite: boolean;
}

const generateCreateNewCopiesDisabled = (useUpdatedUX?: boolean) => ({
  id: 'createNewCopiesDisabled',
  text: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.createNewCopies.disabledTitle',
    {
      defaultMessage: 'Check for existing {useUpdatedUX, select, true {assets} other {objects}}',
      values: { useUpdatedUX },
    }
  ),
  tooltip: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.createNewCopies.disabledText',
    {
      defaultMessage:
        'Check if {useUpdatedUX, select, true {assets} other {objects}} were previously copied or imported.',
      values: { useUpdatedUX },
    }
  ),
});
const generateCreateNewCopiesEnabled = (useUpdatedUX?: boolean) => ({
  id: 'createNewCopiesEnabled',
  text: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.createNewCopies.enabledTitle',
    {
      defaultMessage:
        'Create new {useUpdatedUX, select, true {assets} other {objects}} with unique IDs',
      values: { useUpdatedUX },
    }
  ),
  tooltip: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.createNewCopies.enabledText',
    {
      defaultMessage:
        'Use this option to create one or more copies of the {useUpdatedUX, select, true {asset} other {object}}.',
      values: { useUpdatedUX },
    }
  ),
});
const overwriteEnabled = {
  id: 'overwriteEnabled',
  label: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.overwrite.enabledLabel',
    { defaultMessage: 'Automatically overwrite conflicts' }
  ),
};
const overwriteDisabled = {
  id: 'overwriteDisabled',
  label: i18n.translate(
    'savedObjectsManagement.objectsTable.importModeControl.overwrite.disabledLabel',
    { defaultMessage: 'Request action on conflict' }
  ),
};

const createLabel = ({ text, tooltip }: { text: string; tooltip: string }) => (
  <EuiFlexGroup>
    <EuiFlexItem>
      <EuiText>{text}</EuiText>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiIconTip content={tooltip} position="left" type="iInCircle" />
    </EuiFlexItem>
  </EuiFlexGroup>
);

const overwriteRadio = (disabled: boolean, overwrite: boolean, onChange) => {
  return (
    <EuiCompressedRadioGroup
      options={[overwriteEnabled, overwriteDisabled]}
      idSelected={overwrite ? overwriteEnabled.id : overwriteDisabled.id}
      onChange={(id: string) => onChange({ overwrite: id === overwriteEnabled.id })}
      disabled={disabled}
      data-test-subj={'savedObjectsManagement-importModeControl-overwriteRadioGroup'}
    />
  );
};

export const ImportModeControl = ({
  initialValues,
  isLegacyFile,
  updateSelection,
  optionLabel,
  useUpdatedUX,
}: ImportModeControlProps) => {
  const [createNewCopies, setCreateNewCopies] = useState(initialValues.createNewCopies);
  const [overwrite, setOverwrite] = useState(initialValues.overwrite);
  const createNewCopiesEnabled = generateCreateNewCopiesEnabled(useUpdatedUX);
  const createNewCopiesDisabled = generateCreateNewCopiesDisabled(useUpdatedUX);

  const onChange = (partial: Partial<ImportMode>) => {
    if (partial.createNewCopies !== undefined) {
      setCreateNewCopies(partial.createNewCopies);
    } else if (partial.overwrite !== undefined) {
      setOverwrite(partial.overwrite);
    }
    updateSelection({ createNewCopies, overwrite, ...partial });
  };

  if (isLegacyFile) {
    return overwriteRadio(false, overwrite, onChange);
  }

  return (
    <EuiFormFieldset
      legend={{
        children: (
          <EuiTitle size="xs">
            <span>{optionLabel}</span>
          </EuiTitle>
        ),
      }}
    >
      <EuiCheckableCard
        id={createNewCopiesEnabled.id}
        label={createLabel(createNewCopiesEnabled)}
        checked={createNewCopies}
        onChange={() => onChange({ createNewCopies: true })}
        data-test-subj={'savedObjectsManagement-importModeControl-createNewCopiesEnabled'}
      />

      <EuiSpacer size="s" />

      <EuiCheckableCard
        id={createNewCopiesDisabled.id}
        label={createLabel(createNewCopiesDisabled)}
        checked={!createNewCopies}
        onChange={() => onChange({ createNewCopies: false })}
        data-test-subj={'savedObjectsManagement-importModeControl-createNewCopiesDisabled'}
      >
        {overwriteRadio(createNewCopies, overwrite, onChange)}
      </EuiCheckableCard>
    </EuiFormFieldset>
  );
};
