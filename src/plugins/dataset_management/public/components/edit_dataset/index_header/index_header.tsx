/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiToolTip, EuiFlexItem, EuiSmallButtonIcon, EuiText } from '@elastic/eui';
import { IDataView } from 'src/plugins/data/public';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../types';
import { TopNavControlButtonData, TopNavControlIconData } from '../../../../../navigation/public';

interface IndexHeaderProps {
  dataset: IDataView;
  defaultIndex?: string;
  setDefault?: () => void;
  refreshFields?: () => void;
  deleteDatasetClick?: () => void;
}

const setDefaultAriaLabel = i18n.translate('datasetManagement.editDataset.setDefaultAria', {
  defaultMessage: 'Set as default index.',
});

const setDefaultTooltip = i18n.translate('datasetManagement.editDataset.setDefaultTooltip', {
  defaultMessage: 'Set as default index.',
});

const refreshAriaLabel = i18n.translate('datasetManagement.editDataset.refreshAria', {
  defaultMessage: 'Reload field list.',
});

const refreshTooltip = i18n.translate('datasetManagement.editDataset.refreshTooltip', {
  defaultMessage: 'Refresh field list.',
});

const removeAriaLabel = i18n.translate('datasetManagement.editDataset.removeAria', {
  defaultMessage: 'Remove index pattern.',
});

const removeTooltip = i18n.translate('datasetManagement.editDataset.removeTooltip', {
  defaultMessage: 'Remove index pattern.',
});

export function IndexHeader({
  defaultIndex,
  dataset,
  setDefault,
  refreshFields,
  deleteDatasetClick,
}: IndexHeaderProps) {
  const {
    uiSettings,
    navigationUI: { HeaderControl },
    application,
    workspaces,
  } = useOpenSearchDashboards<DatasetManagmentContext>().services;

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const hideSetDefaultDatasetButton =
    application.capabilities.workspaces?.enabled && !currentWorkspace;

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  return useUpdatedUX ? (
    <HeaderControl
      controls={[
        ...(deleteDatasetClick
          ? [
              {
                color: 'danger',
                run: deleteDatasetClick,
                iconType: 'trash',
                ariaLabel: removeAriaLabel,
                testId: 'deleteDatasetButton',
                display: 'base',
                controlType: 'icon',
                tooltip: removeTooltip,
              } as TopNavControlIconData,
            ]
          : []),
        ...(defaultIndex !== dataset.id && setDefault && !hideSetDefaultDatasetButton
          ? [
              {
                run: setDefault,
                ariaLabel: setDefaultAriaLabel,
                testId: 'setDefaultDatasetButton',
                label: i18n.translate('datasetManagement.editDataset.setDefaultButton.text', {
                  defaultMessage: 'Set as default index',
                }),
                controlType: 'button',
              } as TopNavControlButtonData,
            ]
          : []),
        ...(refreshFields
          ? [
              {
                run: refreshFields,
                iconType: 'refresh',
                ariaLabel: refreshAriaLabel,
                testId: 'refreshFieldsDatasetButton',
                fill: true,
                label: i18n.translate('datasetManagement.editDataset.refreshFieldsButton.text', {
                  defaultMessage: 'Refresh field list',
                }),
                controlType: 'button',
              } as TopNavControlButtonData,
            ]
          : []),
      ]}
      setMountPoint={application.setAppRightControls}
    />
  ) : (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem>
        <EuiText size="s">
          <h1 data-test-subj="datasetTitle">{dataset.title}</h1>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup responsive={false}>
          {defaultIndex !== dataset.id && setDefault && (
            <EuiFlexItem>
              <EuiToolTip content={setDefaultTooltip}>
                <EuiSmallButtonIcon
                  color="text"
                  onClick={setDefault}
                  iconType="starFilled"
                  aria-label={setDefaultAriaLabel}
                  data-test-subj="setDefaultDatasetButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}

          {refreshFields && (
            <EuiFlexItem>
              <EuiToolTip content={refreshTooltip}>
                <EuiSmallButtonIcon
                  color="text"
                  onClick={refreshFields}
                  iconType="refresh"
                  aria-label={refreshAriaLabel}
                  data-test-subj="refreshFieldsDatasetButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}

          {deleteDatasetClick && (
            <EuiFlexItem>
              <EuiToolTip content={removeTooltip}>
                <EuiSmallButtonIcon
                  color="danger"
                  onClick={deleteDatasetClick}
                  iconType="trash"
                  aria-label={removeAriaLabel}
                  data-test-subj="deleteDatasetButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
