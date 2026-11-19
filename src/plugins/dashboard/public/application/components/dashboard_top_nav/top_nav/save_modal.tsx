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

import React, { Fragment } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCompressedFormRow, EuiCompressedTextArea, EuiCompressedSwitch } from '@elastic/eui';

import { SavedObjectSaveModal } from '../../../../../../saved_objects/public';
import {
  CopyPanelsOptionState,
  PanelTitleTemplateField,
  getCopyPanels,
  initialCopyPanelsOptionState,
  isCopyPanelsOptionValid,
} from './copy_panels_option';

interface SaveOptions {
  newTitle: string;
  newDescription: string;
  newCopyOnSave: boolean;
  newTimeRestore: boolean;
  newCopyPanels?: { titleTemplate: string };
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  signal: AbortSignal;
}

interface Props {
  onSave: (options: SaveOptions) => void | Promise<unknown>;
  onClose: () => void;
  title: string;
  description: string;
  timeRestore: boolean;
  showCopyOnSave: boolean;
}

interface State extends CopyPanelsOptionState {
  description: string;
  timeRestore: boolean;
}

export class DashboardSaveModal extends React.Component<Props, State> {
  private abortController = new AbortController();

  state: State = {
    description: this.props.description,
    timeRestore: this.props.timeRestore,
    ...initialCopyPanelsOptionState,
  };

  saveDashboard = ({
    newTitle,
    newCopyOnSave,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
  }: {
    newTitle: string;
    newCopyOnSave: boolean;
    isTitleDuplicateConfirmed: boolean;
    onTitleDuplicate: () => void;
  }) => {
    return this.props.onSave({
      newTitle,
      newDescription: this.state.description,
      newCopyOnSave,
      newTimeRestore: this.state.timeRestore,
      newCopyPanels: newCopyOnSave ? getCopyPanels(this.state) : undefined,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
      signal: this.abortController.signal,
    });
  };

  // Cancel, X, Esc and backdrop: stop an in-flight save as new, then close.
  onClose = () => {
    this.abortController.abort();
    this.props.onClose();
  };

  onDescriptionChange = (event: any) => {
    this.setState({
      description: event.target.value,
    });
  };

  onTimeRestoreChange = (event: any) => {
    this.setState({
      timeRestore: event.target.checked,
    });
  };

  renderDashboardSaveOptions(copyOnSave: boolean) {
    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="dashboard.topNav.saveModal.descriptionFormRowLabel"
              defaultMessage="Description"
            />
          }
        >
          <EuiCompressedTextArea
            data-test-subj="dashboardDescription"
            value={this.state.description}
            onChange={this.onDescriptionChange}
          />
        </EuiCompressedFormRow>

        <EuiCompressedFormRow
          helpText={
            <FormattedMessage
              id="dashboard.topNav.saveModal.storeTimeWithDashboardFormRowHelpText"
              defaultMessage="This changes the time filter to the currently selected time each time this dashboard is loaded."
            />
          }
        >
          <EuiCompressedSwitch
            data-test-subj="storeTimeWithDashboard"
            checked={this.state.timeRestore}
            onChange={this.onTimeRestoreChange}
            label={
              <FormattedMessage
                id="dashboard.topNav.saveModal.storeTimeWithDashboardFormRowLabel"
                defaultMessage="Store time with dashboard"
              />
            }
          />
        </EuiCompressedFormRow>

        {copyOnSave && (
          <EuiCompressedFormRow
            helpText={
              <FormattedMessage
                id="dashboard.topNav.saveModal.copyPanelsFormRowHelpText"
                defaultMessage="Copy panels so edits in the new dashboard do not affect the original."
              />
            }
          >
            <EuiCompressedSwitch
              data-test-subj="copyPanelsOnSave"
              checked={this.state.copyPanels}
              onChange={(e) => this.setState({ copyPanels: e.target.checked })}
              label={
                <FormattedMessage
                  id="dashboard.topNav.saveModal.copyPanelsFormRowLabel"
                  defaultMessage="Copy panels"
                />
              }
            />
          </EuiCompressedFormRow>
        )}

        {copyOnSave && this.state.copyPanels && (
          <PanelTitleTemplateField
            data-test-subj="copyPanelsTitleTemplate"
            value={this.state.panelTitleTemplate}
            onChange={(panelTitleTemplate) => this.setState({ panelTitleTemplate })}
          />
        )}
      </Fragment>
    );
  }

  render() {
    return (
      <SavedObjectSaveModal
        onSave={this.saveDashboard}
        onClose={this.onClose}
        title={this.props.title}
        showCopyOnSave={this.props.showCopyOnSave}
        objectType="dashboard"
        options={({ copyOnSave }) => this.renderDashboardSaveOptions(copyOnSave)}
        isValid={({ copyOnSave }) => !copyOnSave || isCopyPanelsOptionValid(this.state)}
        showDescription={false}
      />
    );
  }
}
