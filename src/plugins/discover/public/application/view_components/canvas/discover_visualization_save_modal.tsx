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

import {
  htmlIdGenerator,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiCompressedFieldText,
  EuiForm,
  EuiCompressedFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiRadioGroup,
  EuiSelect,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface OnSaveProps {
  title: string;
  selectedOption: string;
  newDashboardTitle: string;
  existingDashboardTitle: string;
}

interface Props {
  onSave: (props: OnSaveProps) => void;
  onClose: () => void;
  description?: string;
  dashboards: Array<{ id: string; title: string }>;
}

export interface SaveModalState {
  title: string;
  visualizationDescription: string;
  selectedOption: string;
  newDashboardTitle: string;
  existingDashboardTitle: string;
}

export class SavedObjectSaveModal extends React.Component<Props, SaveModalState> {
  public readonly state = {
    title: '',
    visualizationDescription: this.props.description ? this.props.description : '',
    selectedOption: 'Existing dashboard',
    newDashboardTitle: '',
    existingDashboardTitle: this.props.dashboards[0].title,
  };

  public render() {
    return (
      <EuiModal
        data-test-subj="discoverVizSaveModal"
        className="osdSavedObjectSaveModal"
        onClose={this.props.onClose}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiText size="s">
              <h2>
                <FormattedMessage id="discover.saveModal.saveTitle" defaultMessage="Save" />
              </h2>
            </EuiText>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm component="form" id="discover.saveModalForm">
            <EuiText size="s" color="subdued">
              {this.props.description}
            </EuiText>

            <EuiSpacer />

            <EuiCompressedFormRow
              fullWidth
              label={<FormattedMessage id="discover.saveModal.titleLabel" defaultMessage="Title" />}
            >
              <EuiCompressedFieldText
                fullWidth
                autoFocus
                data-test-subj="savedObjectTitle"
                value={this.state.title}
                onChange={this.onTitleChange}
              />
            </EuiCompressedFormRow>

            {/* <EuiCompressedFormRow
              fullWidth
              label={<FormattedMessage id="discover.saveModal.addTo" defaultMessage="Add to" />}
            >
              <EuiRadioGroup
                options={[
                  {
                    id: 'Existing dashboard',
                    label: 'Existing dashboard',
                  },
                  {
                    id: 'New dashboard',
                    label: 'New dashboard',
                  },
                ]}
                idSelected={this.state.selectedOption}
                onChange={(id) => this.setState({ selectedOption: id })}
              />
            </EuiCompressedFormRow>

            {this.state.selectedOption === 'Existing dashboard' ? (
              <EuiCompressedFormRow
                fullWidth
                label={
                  <FormattedMessage
                    id="discover.saveModal.existingDashboard"
                    defaultMessage="Selecting existing dashboard"
                  />
                }
              >
                <EuiSelect
                  options={this.props.dashboards.map((dashboard) => ({
                    value: dashboard.id,
                    text: dashboard.title,
                  }))}
                  value={this.state.existingDashboardTitle}
                  onChange={this.onExistingDashboardTitleChange}
                />
              </EuiCompressedFormRow>
            ) : (
              <EuiCompressedFormRow
                fullWidth
                label={
                  <FormattedMessage
                    id="discover.saveModal.newDashboard"
                    defaultMessage="Dashboard title"
                  />
                }
              >
                <EuiCompressedFieldText
                  fullWidth
                  autoFocus
                  data-test-subj="newDashboardTitle"
                  value={this.state.newDashboardTitle}
                  onChange={this.onNewDashboardTitleChange}
                />
              </EuiCompressedFormRow>
            )} */}
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiSmallButtonEmpty data-test-subj="saveCancelButton" onClick={this.props.onClose}>
            <FormattedMessage id="discover.saveModal.cancelButtonLabel" defaultMessage="Cancel" />
          </EuiSmallButtonEmpty>

          {this.renderConfirmButton()}
        </EuiModalFooter>
      </EuiModal>
    );
  }

  private saveSavedObject = async () => {
    await this.props.onSave({
      title: this.state.title,
      selectedOption: this.state.selectedOption,
      newDashboardTitle: this.state.newDashboardTitle,
      existingDashboardTitle: this.state.existingDashboardTitle,
    });
  };

  private onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      title: event.target.value,
    });
  };

  private onNewDashboardTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      newDashboardTitle: event.target.value,
    });
  };

  private onExistingDashboardTitleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      existingDashboardTitle: event.target.value,
    });
  };

  private renderConfirmButton = () => {
    const { title, newDashboardTitle, existingDashboardTitle } = this.state;

    const confirmLabel: string | React.ReactNode = i18n.translate(
      'discover.saveModal.saveButtonLabel',
      {
        defaultMessage: 'Save',
      }
    );

    return (
      <EuiSmallButton
        fill
        data-test-subj="confirmSaveSavedObjectButton"
        isDisabled={
          title.length === 0 ||
          (this.state.selectedOption === 'New dashboard'
            ? newDashboardTitle.length === 0
            : existingDashboardTitle.length === 0)
        }
        type="submit"
        form="discoveraveModalForm"
        onClick={this.saveSavedObject}
      >
        {confirmLabel}
      </EuiSmallButton>
    );
  };
}
