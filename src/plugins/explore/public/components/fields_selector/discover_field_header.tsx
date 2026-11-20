/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiText } from '@elastic/eui';
import './discover_field_header.scss';

export interface IDiscoverFieldHeaderProps {
  onCollapse?: () => void;
}

export function DiscoverFieldHeader({ onCollapse }: IDiscoverFieldHeaderProps) {
  const fieldsHeaderText = i18n.translate('explore.discover.fieldChooser.Header', {
    defaultMessage: 'Fields',
  });
  const collapseLabel = i18n.translate('explore.discoverFieldHeader.collapseFieldsPanelAriaLabel', {
    defaultMessage: 'Collapse fields panel',
  });
  return (
    <EuiFlexGroup responsive={false} gutterSize="xs">
      <EuiFlexItem>
        <EuiText size="s" className="exploreSidebar__headerTitle__text">
          {fieldsHeaderText}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label={collapseLabel}
          data-test-subj={'fieldList-collapse-button'}
          iconType={'menuLeft'}
          onClick={onCollapse}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
