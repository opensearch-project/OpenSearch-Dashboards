/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './empty_dataset_prompt.scss';

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';

import { EuiPageContent, EuiSpacer, EuiText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { EuiDescriptionListTitle } from '@elastic/eui';
import { EuiDescriptionListDescription, EuiDescriptionList } from '@elastic/eui';
import { EuiLink } from '@elastic/eui';
import { DatasetCreationOption } from '../../types';
import { CreateButton, CreateDatasetButton } from '../../create_button';
import { Illustration } from './assets/dataset_illustration';

interface Props {
  canSave: boolean;
  creationOptions?: DatasetCreationOption[];
  onCreateDataset?: (signalType: string) => void;
  docLinksDatasetIntro: string;
}

export const EmptyDatasetPrompt = ({
  canSave,
  creationOptions,
  onCreateDataset,
  docLinksDatasetIntro,
}: Props) => {
  // Render the appropriate button based on which props are provided
  const renderCreateButton = () => {
    if (!canSave) return null;

    // If onCreateDataset is provided, use the new CreateDatasetButton
    if (onCreateDataset) {
      return (
        <CreateDatasetButton onCreateDataset={onCreateDataset}>
          <FormattedMessage
            id="datasetManagement.datasetTable.createButton"
            defaultMessage="Create dataset"
          />
        </CreateDatasetButton>
      );
    }

    // Otherwise, fall back to the old CreateButton with creationOptions
    if (creationOptions) {
      return (
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <CreateButton options={creationOptions}>
          <FormattedMessage
            id="datasetManagement.datasetTable.createBtn"
            defaultMessage="Create index pattern"
          />
        </CreateButton>
      );
    }

    return null;
  };

  return (
    <EuiPageContent
      data-test-subj="emptyDatasetPrompt"
      className="inpEmptyDatasetPrompt"
      grow={false}
      horizontalPosition="center"
    >
      <EuiFlexGroup gutterSize="xl" alignItems="center" direction="rowReverse" wrap>
        <EuiFlexItem grow={1} className="inpEmptyDatasetPrompt__illustration">
          <Illustration />
        </EuiFlexItem>
        <EuiFlexItem grow={2} className="inpEmptyDatasetPrompt__text">
          <EuiText grow={false}>
            <h2>
              <FormattedMessage
                id="datasetManagement.emptyDatasetPrompt.youHaveData"
                defaultMessage="You have data in OpenSearch."
              />
              <br />
              <FormattedMessage
                id="datasetManagement.emptyDatasetPrompt.nowCreate"
                defaultMessage="Now, create an index pattern."
              />
            </h2>
            <p>
              <FormattedMessage
                id="datasetManagement.emptyDatasetPrompt.datasetExplanation"
                defaultMessage="OpenSearch Dashboards requires an index pattern to identify which indices you want to explore. An
                index pattern can point to a specific index, for example, your log data from
                yesterday, or all indices that contain your log data."
              />
            </p>
            {renderCreateButton()}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xxl" />
      <EuiDescriptionList className="inpEmptyDatasetPrompt__footer" type="responsiveColumn">
        <EuiDescriptionListTitle className="inpEmptyDatasetPrompt__title">
          <FormattedMessage
            id="datasetManagement.emptyDatasetPrompt.learnMore"
            defaultMessage="Want to learn more?"
          />
        </EuiDescriptionListTitle>
        <EuiDescriptionListDescription>
          <EuiLink href={docLinksDatasetIntro} target="_blank" external>
            <FormattedMessage
              id="datasetManagement.emptyDatasetPrompt.documentation"
              defaultMessage="Read documentation"
            />
          </EuiLink>
        </EuiDescriptionListDescription>
      </EuiDescriptionList>
    </EuiPageContent>
  );
};
