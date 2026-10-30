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
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiCompressedFormRow,
  EuiCompressedTextArea,
  EuiCompressedSwitch,
  EuiCompressedFieldText,
} from '@elastic/eui';

import { SavedObjectSaveModal } from '../../../../../../saved_objects/public';
import {
  DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
  isPanelCopyTitleTemplateValid,
} from '../../../utils/panel_copy_title_template';

interface SaveOptions {
  newTitle: string;
  newDescription: string;
  newCopyOnSave: boolean;
  newTimeRestore: boolean;
  newCopyPanels: boolean;
  newCopyPanelsTitleTemplate: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
}

interface Props {
  onSave: ({
    newTitle,
    newDescription,
    newCopyOnSave,
    newTimeRestore,
    newCopyPanels,
    newCopyPanelsTitleTemplate,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
  }: SaveOptions) => void;
  onClose: () => void;
  title: string;
  description: string;
  timeRestore: boolean;
  showCopyOnSave: boolean;
}

interface State {
  description: string;
  timeRestore: boolean;
  copyPanels: boolean;
  titleTemplate: string;
}

export class DashboardSaveModal extends React.Component<Props, State> {
  state: State = {
    description: this.props.description,
    timeRestore: this.props.timeRestore,
    copyPanels: false,
    titleTemplate: DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
  };

  constructor(props: Props) {
    super(props);
  }

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
    const copyPanels = newCopyOnSave && this.state.copyPanels;
    // Block the save when the copied-panel title template is invalid.
    if (copyPanels && !isPanelCopyTitleTemplateValid(this.state.titleTemplate)) {
      return;
    }
    // Return the onSave promise so the upstream modal awaits the full copy+save
    // and keeps the confirm button in its loading state until it resolves,
    // preventing a double-submit. A validation early-return above still returns
    // undefined, so the button is re-enabled for the user to fix the template.
    return this.props.onSave({
      newTitle,
      newDescription: this.state.description,
      newCopyOnSave,
      newTimeRestore: this.state.timeRestore,
      newCopyPanels: copyPanels,
      newCopyPanelsTitleTemplate: this.state.titleTemplate,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    });
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

  onCopyPanelsChange = (event: any) => {
    this.setState({
      copyPanels: event.target.checked,
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
              onChange={this.onCopyPanelsChange}
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
          <EuiCompressedFormRow
            label={i18n.translate('dashboard.topNav.saveModal.copyPanelsTitleTemplateLabel', {
              defaultMessage: 'Copied panel title',
            })}
            isInvalid={!isPanelCopyTitleTemplateValid(this.state.titleTemplate)}
            error={i18n.translate('dashboard.topNav.saveModal.copyPanelsTitleTemplateError', {
              defaultMessage: 'Enter a title that includes {panelToken}.',
              values: { panelToken: '{{panelTitle}}' },
            })}
            helpText={i18n.translate('dashboard.topNav.saveModal.copyPanelsTitleTemplateHelp', {
              defaultMessage:
                'Use {panelToken} for the original panel title and {dashboardToken} for the new dashboard title.',
              values: {
                panelToken: '{{panelTitle}}',
                dashboardToken: '{{dashboardTitle}}',
              },
            })}
          >
            <EuiCompressedFieldText
              data-test-subj="copyPanelsTitleTemplate"
              value={this.state.titleTemplate}
              isInvalid={!isPanelCopyTitleTemplateValid(this.state.titleTemplate)}
              onChange={(e) => this.setState({ titleTemplate: e.target.value })}
            />
          </EuiCompressedFormRow>
        )}
      </Fragment>
    );
  }

  render() {
    return (
      <SavedObjectSaveModal
        onSave={this.saveDashboard}
        onClose={this.props.onClose}
        title={this.props.title}
        showCopyOnSave={this.props.showCopyOnSave}
        objectType="dashboard"
        options={(state: { copyOnSave: boolean }) =>
          this.renderDashboardSaveOptions(state.copyOnSave)
        }
        showDescription={false}
      />
    );
  }
}
