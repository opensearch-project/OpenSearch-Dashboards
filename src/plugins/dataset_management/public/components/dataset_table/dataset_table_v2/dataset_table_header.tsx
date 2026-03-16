/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { CreateDatasetButton } from '../../create_button';

interface DatasetTableHeaderProps {
  canSave: boolean;
  useUpdatedUX: boolean;
  currentWorkspaceName?: string;
  onCreateDataset: (signalType: string) => void;
  HeaderControl?: React.ComponentType<any>;
  setAppRightControls?: ApplicationStart['setAppRightControls'];
  setAppDescriptionControls?: ApplicationStart['setAppDescriptionControls'];
}

const title = i18n.translate('datasetManagement.datasetTable.title', {
  defaultMessage: 'Datasets',
});

export const DatasetTableHeader: React.FC<DatasetTableHeaderProps> = ({
  canSave,
  useUpdatedUX,
  currentWorkspaceName,
  onCreateDataset,
  HeaderControl,
  setAppRightControls,
  setAppDescriptionControls,
}) => {
  const description = currentWorkspaceName
    ? i18n.translate('datasetManagement.datasetTable.datasetExplanationWithWorkspace', {
        defaultMessage:
          'Create and manage the datasets that help you retrieve your data from OpenSearch for {name} workspace.',
        values: {
          name: currentWorkspaceName,
        },
      })
    : i18n.translate('datasetManagement.datasetTable.datasetExplanation', {
        defaultMessage:
          'Create and manage the datasets that help you retrieve your data from OpenSearch.',
      });

  const createButton = (() => {
    if (!canSave) return null;

    const button = (
      <CreateDatasetButton onCreateDataset={onCreateDataset}>
        <FormattedMessage
          id="datasetManagement.datasetTable.createButton"
          defaultMessage="Create dataset"
        />
      </CreateDatasetButton>
    );

    return useUpdatedUX && HeaderControl && setAppRightControls ? (
      <HeaderControl controls={[{ renderComponent: button }]} setMountPoint={setAppRightControls} />
    ) : (
      <EuiFlexItem grow={false}>{button}</EuiFlexItem>
    );
  })();

  const pageTitleAndDescription =
    useUpdatedUX && HeaderControl && setAppDescriptionControls ? (
      <HeaderControl controls={[{ description }]} setMountPoint={setAppDescriptionControls} />
    ) : (
      <EuiFlexItem grow={false}>
        <EuiText size="s">
          <h1>{title}</h1>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText size="s">
          <p>{description}</p>
        </EuiText>
      </EuiFlexItem>
    );

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      {pageTitleAndDescription}
      {createButton}
    </EuiFlexGroup>
  );
};
