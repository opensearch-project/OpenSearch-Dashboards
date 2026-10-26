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
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCompressedFieldText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiCallOut,
  EuiCompressedCheckbox,
  EuiCompressedFormRow,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import {
  DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
  isPanelCopyTitleTemplateValid,
} from '../../../utils/panel_copy_title_template';

interface Props {
  onClone: (
    newTitle: string,
    isTitleDuplicateConfirmed: boolean,
    onTitleDuplicate: () => void,
    copyPanels: boolean,
    titleTemplate: string,
    signal: AbortSignal
  ) => Promise<void>;
  onClose: () => void;
  title: string;
}

interface State {
  newDashboardName: string;
  isTitleDuplicateConfirmed: boolean;
  hasTitleDuplicate: boolean;
  isLoading: boolean;
  copyPanels: boolean;
  titleTemplate: string;
}

export class DashboardCloneModal extends React.Component<Props, State> {
  private isMounted = false;
  private abortController?: AbortController;

  constructor(props: Props) {
    super(props);

    this.state = {
      newDashboardName: props.title,
      isTitleDuplicateConfirmed: false,
      hasTitleDuplicate: false,
      isLoading: false,
      copyPanels: false,
      titleTemplate: DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
    };
  }
  componentDidMount() {
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  onTitleDuplicate = () => {
    this.setState({
      isTitleDuplicateConfirmed: true,
      hasTitleDuplicate: true,
    });
  };

  // Cancel aborts an in-flight copy so no further requests are sent, then closes.
  onCancel = () => {
    this.abortController?.abort();
    this.props.onClose();
  };

  cloneDashboard = async () => {
    this.setState({
      isLoading: true,
    });

    this.abortController = new AbortController();

    await this.props.onClone(
      this.state.newDashboardName,
      this.state.isTitleDuplicateConfirmed,
      this.onTitleDuplicate,
      this.state.copyPanels,
      this.state.titleTemplate,
      this.abortController.signal
    );

    if (this.isMounted) {
      this.setState({
        isLoading: false,
      });
    }
  };

  onInputChange = (event: any) => {
    this.setState({
      newDashboardName: event.target.value,
      isTitleDuplicateConfirmed: false,
      hasTitleDuplicate: false,
    });
  };

  renderDuplicateTitleCallout = () => {
    if (!this.state.hasTitleDuplicate) {
      return;
    }

    return (
      <Fragment>
        <EuiSpacer />
        <EuiCallOut
          size="s"
          title={i18n.translate('dashboard.topNav.cloneModal.dashboardExistsTitle', {
            defaultMessage: 'A dashboard with the title {newDashboardName} already exists.',
            values: {
              newDashboardName: `'${this.state.newDashboardName}'`,
            },
          })}
          color="warning"
          data-test-subj="titleDupicateWarnMsg"
        >
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dashboard.topNav.cloneModal.dashboardExistsDescription"
                defaultMessage="Click {confirmClone} to clone the dashboard with the duplicate title."
                values={{
                  confirmClone: (
                    <strong>
                      <FormattedMessage
                        id="dashboard.topNav.cloneModal.confirmCloneDescription"
                        defaultMessage="Confirm Clone"
                      />
                    </strong>
                  ),
                }}
              />
            </p>
          </EuiText>
        </EuiCallOut>
      </Fragment>
    );
  };

  render() {
    const templateValid = isPanelCopyTitleTemplateValid(this.state.titleTemplate);
    return (
      <EuiModal
        data-test-subj="dashboardCloneModal"
        className="dshCloneModal"
        onClose={this.props.onClose}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiText size="s">
              <h2>
                <FormattedMessage
                  id="dashboard.topNav.cloneModal.cloneDashboardModalHeaderTitle"
                  defaultMessage="Clone dashboard"
                />
              </h2>
            </EuiText>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dashboard.topNav.cloneModal.enterNewNameForDashboardDescription"
                defaultMessage="Please enter a new name for your dashboard."
              />
            </p>
          </EuiText>

          <EuiSpacer />

          <EuiCompressedFieldText
            autoFocus
            aria-label={i18n.translate('dashboard.cloneModal.cloneDashboardTitleAriaLabel', {
              defaultMessage: 'Cloned Dashboard Title',
            })}
            data-test-subj="clonedDashboardTitle"
            value={this.state.newDashboardName}
            onChange={this.onInputChange}
            isInvalid={this.state.hasTitleDuplicate}
          />

          {this.renderDuplicateTitleCallout()}

          <EuiSpacer />

          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiCompressedCheckbox
                id="dashboardCloneCopyPanels"
                data-test-subj="cloneCopyPanelsCheckbox"
                checked={this.state.copyPanels}
                onChange={(e) => this.setState({ copyPanels: e.target.checked })}
                label={i18n.translate('dashboard.topNav.cloneModal.copyPanelsLabel', {
                  defaultMessage: 'Copy panels',
                })}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIconTip
                type="questionInCircle"
                content={i18n.translate('dashboard.topNav.cloneModal.copyPanelsTooltip', {
                  defaultMessage:
                    'Also duplicate this dashboard\u2019s panels and point the clone at the copies, so edits in the clone do not affect the original. Shared data (index patterns, data sources) stays shared.',
                })}
              />
            </EuiFlexItem>
          </EuiFlexGroup>

          {this.state.copyPanels && (
            <>
              <EuiSpacer size="s" />
              <EuiCompressedFormRow
                label={i18n.translate('dashboard.topNav.cloneModal.copyPanelsTitleTemplateLabel', {
                  defaultMessage: 'Copied panel title',
                })}
                isInvalid={!templateValid}
                error={i18n.translate('dashboard.topNav.cloneModal.copyPanelsTitleTemplateError', {
                  defaultMessage: 'Enter a title that includes {panelToken}.',
                  values: { panelToken: '{{panelTitle}}' },
                })}
                helpText={i18n.translate(
                  'dashboard.topNav.cloneModal.copyPanelsTitleTemplateHelp',
                  {
                    defaultMessage:
                      'Use {panelToken} for the original panel title and {dashboardToken} for the new dashboard title.',
                    values: {
                      panelToken: '{{panelTitle}}',
                      dashboardToken: '{{dashboardTitle}}',
                    },
                  }
                )}
              >
                <EuiCompressedFieldText
                  data-test-subj="cloneCopyPanelsTitleTemplate"
                  value={this.state.titleTemplate}
                  isInvalid={!templateValid}
                  onChange={(e) => this.setState({ titleTemplate: e.target.value })}
                />
              </EuiCompressedFormRow>
            </>
          )}
        </EuiModalBody>

        <EuiModalFooter>
          <EuiSmallButtonEmpty data-test-subj="cloneCancelButton" onClick={this.onCancel}>
            <FormattedMessage
              id="dashboard.topNav.cloneModal.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          </EuiSmallButtonEmpty>

          <EuiSmallButton
            fill
            data-test-subj="cloneConfirmButton"
            onClick={this.cloneDashboard}
            isLoading={this.state.isLoading}
            disabled={this.state.copyPanels && !templateValid}
          >
            <FormattedMessage
              id="dashboard.topNav.cloneModal.confirmButtonLabel"
              defaultMessage="Confirm Clone"
            />
          </EuiSmallButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
}
