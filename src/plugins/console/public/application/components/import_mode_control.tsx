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
import { EuiFormFieldset, EuiTitle, EuiRadioGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface ImportModeControlProps {
  initialValues: ImportMode;
  isLegacyFile: boolean;
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

export const ImportModeControl = ({
  initialValues,
  isLegacyFile,
  updateSelection,
}: ImportModeControlProps) => {
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

  if (isLegacyFile) {
    return overwriteRadio;
  }

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
