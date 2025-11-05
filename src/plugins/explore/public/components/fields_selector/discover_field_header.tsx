/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiText } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

export interface IDiscoverFieldHeaderProps {
  onCollapse?: () => void;
}

export function DiscoverFieldHeader({ onCollapse }: IDiscoverFieldHeaderProps) {
  const fieldsHeaderText = i18n.translate('explore.discover.fieldChooser.Header', {
    defaultMessage: 'Fields',
  });
  const { services } = useOpenSearchDashboards();
  const { keyboardShortcut } = services;

  const handleCollapseClick = useCallback(() => {
    if (onCollapse) {
      onCollapse();
    }
  }, [onCollapse]);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'ToggleFieldsPanel',
    pluginId: 'explore',
    name: i18n.translate('explore.discoverFieldHeader.toggleFieldsPanelShortcut', {
      defaultMessage: 'Toggle fields panel',
    }),
    category: i18n.translate('explore.discoverFieldHeader.panelLayoutCategory', {
      defaultMessage: 'Panel / layout',
    }),
    keys: 'shift+f',
    execute: handleCollapseClick,
  });
  return (
    <EuiFlexGroup responsive={false} gutterSize="xs">
      <EuiFlexItem>
        <EuiText size="xs">
          <h5>{fieldsHeaderText}</h5>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label="Collapse fields panel"
          data-test-subj={'fieldList-collapse-button'}
          iconType={'menuLeft'}
          onClick={onCollapse}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
