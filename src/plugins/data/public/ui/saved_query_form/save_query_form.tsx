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

import React from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiFlyoutHeader,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
} from '@elastic/eui';
import { SavedQueryService } from '../..';
import { SavedQueryAttributes } from '../../query';
import { useSaveQueryFormContent } from './helpers';

interface Props {
  formUiType: 'Modal' | 'Flyout';
  savedQuery?: SavedQueryAttributes;
  savedQueryService: SavedQueryService;
  onSave: (savedQueryMeta: SavedQueryMeta) => void;
  onClose: () => void;
  setSaveAsNew?: (shouldSaveAsNew: boolean) => void;
  showFilterOption?: boolean;
  showTimeFilterOption?: boolean;
  saveAsNew?: boolean;
  cannotBeOverwritten?: boolean;
}

export interface SavedQueryMeta {
  title: string;
  description: string;
  shouldIncludeFilters: boolean;
  shouldIncludeTimeFilter: boolean;
}

export function SaveQueryForm({
  formUiType,
  savedQuery,
  savedQueryService,
  onSave,
  onClose,
  showFilterOption = true,
  showTimeFilterOption = true,
  saveAsNew,
  setSaveAsNew,
  cannotBeOverwritten,
}: Props) {
  const { header, body, footer } = useSaveQueryFormContent({
    formUiType,
    savedQuery,
    savedQueryService,
    onSave,
    onClose,
    showFilterOption,
    showTimeFilterOption,
    saveAsNew,
    setSaveAsNew,
    cannotBeOverwritten,
  });

  return formUiType === 'Modal' ? (
    <EuiModal onClose={onClose} initialFocus="[name=title]">
      <EuiModalHeader>
        <EuiModalHeaderTitle>{header}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{body}</EuiModalBody>

      <EuiModalFooter>{footer}</EuiModalFooter>
    </EuiModal>
  ) : (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutHeader hasBorder>{header}</EuiFlyoutHeader>
      <EuiFlyoutBody>{body}</EuiFlyoutBody>
      <EuiFlyoutFooter>{footer}</EuiFlyoutFooter>
    </EuiFlyout>
  );
}
