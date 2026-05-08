/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiSelectable,
  EuiText,
  EuiSpacer,
  EuiSelectableOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ReferencingDashboard } from '../../utils/find_referencing_dashboards';

export interface DashboardSelectionModalProps {
  dashboards: ReferencingDashboard[];
  onSelect: (dashboardId: string) => void;
  onCancel: () => void;
}

export const DashboardSelectionModal: React.FC<DashboardSelectionModalProps> = ({
  dashboards,
  onSelect,
  onCancel,
}) => {
  const [selectedDashboard, setSelectedDashboard] = useState<string | undefined>();

  const options: EuiSelectableOption[] = useMemo(
    () =>
      dashboards.map((dashboard) => ({
        label: dashboard.title,
        searchableLabel: dashboard.title,
        key: dashboard.id,
        checked: selectedDashboard === dashboard.id ? 'on' : undefined,
      })),
    [dashboards, selectedDashboard]
  );

  return (
    <EuiModal onClose={onCancel} maxWidth={600}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('explore.dashboardSelectionModal.title', {
            defaultMessage: 'Select Dashboard Context',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText size="s">
          <p>
            {i18n.translate('explore.dashboardSelectionModal.description', {
              defaultMessage:
                'This visualization is used in multiple dashboards. Select a dashboard to open the visualization with its context, or open it directly.',
            })}
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiSelectable
          aria-label={i18n.translate('explore.dashboardSelectionModal.selectableLabel', {
            defaultMessage: 'Select a dashboard',
          })}
          options={options}
          singleSelection={true}
          onChange={(newOptions) => {
            const selected = newOptions.find((option) => option.checked === 'on');
            setSelectedDashboard(selected?.key);
          }}
          listProps={{
            bordered: true,
          }}
          searchable={dashboards.length > 5}
        >
          {(list, search) => (
            <>
              {dashboards.length > 5 && search}
              {list}
            </>
          )}
        </EuiSelectable>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel}>
          {i18n.translate('explore.dashboardSelectionModal.openDirectlyButton', {
            defaultMessage: 'Open directly',
          })}
        </EuiButtonEmpty>
        <EuiButton
          fill
          onClick={() => selectedDashboard && onSelect(selectedDashboard)}
          disabled={!selectedDashboard}
        >
          {i18n.translate('explore.dashboardSelectionModal.openWithDashboardButton', {
            defaultMessage: 'Open with dashboard',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
