/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

export interface Props {
  onCreateIndexPattern: () => void;
  onNormalizeIndexPattern: () => void;
}

export function DiscoverFieldDataFrame({ onCreateIndexPattern, onNormalizeIndexPattern }: Props) {
  return (
    <EuiFlexGroup responsive={false} gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          iconType="package"
          onClick={onNormalizeIndexPattern}
          size="xs"
          className="dscSideBar_normalizeIndexPattern"
          data-test-subj="dscSideBarNormalizeIndexPatternButton"
        >
          {i18n.translate('discover.fieldChooser.dataFrame.normalizeIndexPattern', {
            defaultMessage: 'Normalize',
          })}
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          iconType="save"
          onClick={onCreateIndexPattern}
          size="xs"
          className="dscSideBar_createIndexPattern"
          data-test-subj="dscSideBarCreateIndexPatternButton"
        >
          {i18n.translate('discover.fieldChooser.dataFrame.createIndexPattern', {
            defaultMessage: 'Create index pattern',
          })}
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
