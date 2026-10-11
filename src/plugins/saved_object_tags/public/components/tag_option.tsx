/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiComboBoxOptionOption, EuiHighlight } from '@elastic/eui';

export const renderTagOption = (option: EuiComboBoxOptionOption<string>, searchValue: string) => (
  <EuiBadge color={option.color || 'hollow'}>
    <EuiHighlight search={searchValue}>{option.label}</EuiHighlight>
  </EuiBadge>
);
