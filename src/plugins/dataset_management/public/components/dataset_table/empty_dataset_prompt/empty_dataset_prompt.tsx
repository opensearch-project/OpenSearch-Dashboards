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

import './empty_dataset_prompt.scss';

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';

import { EuiPageContent, EuiSpacer, EuiText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { EuiDescriptionListTitle } from '@elastic/eui';
import { EuiDescriptionListDescription, EuiDescriptionList } from '@elastic/eui';
import { EuiLink } from '@elastic/eui';
import { DatasetCreationOption } from '../../types';
import { CreateButton } from '../../create_button';
import { Illustration } from './assets/dataset_illustration';

interface Props {
  canSave: boolean;
  creationOptions: DatasetCreationOption[];
  docLinksDatasetIntro: string;
}

export const EmptyDatasetPrompt = ({ canSave, creationOptions, docLinksDatasetIntro }: Props) => {
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
            {canSave && (
              <CreateButton options={creationOptions}>
                <FormattedMessage
                  id="datasetManagement.datasetTable.createBtn"
                  defaultMessage="Create index pattern"
                />
              </CreateButton>
            )}
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
