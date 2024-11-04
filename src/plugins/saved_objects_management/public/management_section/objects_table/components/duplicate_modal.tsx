/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiComboBox,
  EuiFormRow,
  EuiCheckbox,
} from '@elastic/eui';
import { HttpSetup, NotificationsStart, WorkspacesStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { WorkspaceOption, getTargetWorkspacesOptions } from './utils';
import { DuplicateObject } from '../../types';

export interface ShowDuplicateModalProps {
  onDuplicate: (
    savedObjects: DuplicateObject[],
    includeReferencesDeep: boolean,
    targetWorkspace: string,
    targetWorkspaceName: string
  ) => Promise<void>;
  http: HttpSetup;
  workspaces: WorkspacesStart;
  notifications: NotificationsStart;
  selectedSavedObjects: DuplicateObject[];
  onClose: () => void;
  useUpdatedUX?: boolean;
}

interface State {
  allSelectedObjects: DuplicateObject[];
  workspaceOptions: WorkspaceOption[];
  targetWorkspaceOption: WorkspaceOption[];
  isLoading: boolean;
  isIncludeReferencesDeepChecked: boolean;
}

export class SavedObjectsDuplicateModal extends React.Component<ShowDuplicateModalProps, State> {
  private isMounted = false;

  constructor(props: ShowDuplicateModalProps) {
    super(props);

    const { workspaces } = props;
    const currentWorkspace = workspaces.currentWorkspace$.value;
    const targetWorkspacesOptions = getTargetWorkspacesOptions(workspaces, currentWorkspace!);

    this.state = {
      allSelectedObjects: props.selectedSavedObjects,
      workspaceOptions: targetWorkspacesOptions,
      targetWorkspaceOption: [],
      isLoading: false,
      isIncludeReferencesDeepChecked: true,
    };
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  duplicateSavedObjects = async (savedObjects: DuplicateObject[]) => {
    const selectedWorkspace = this.state.targetWorkspaceOption[0];
    if (!selectedWorkspace) {
      return;
    }
    const targetWorkspace = selectedWorkspace.key;
    const targetWorkspaceName = selectedWorkspace.label;

    this.setState({
      isLoading: true,
    });

    await this.props.onDuplicate(
      savedObjects,
      this.state.isIncludeReferencesDeepChecked,
      targetWorkspace!,
      targetWorkspaceName
    );

    if (this.isMounted) {
      this.setState({
        isLoading: false,
      });
    }
  };

  onTargetWorkspaceChange = (targetWorkspaceOption: WorkspaceOption[]) => {
    this.setState({
      targetWorkspaceOption,
    });
  };

  changeIncludeReferencesDeep = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      isIncludeReferencesDeepChecked: e.target.checked,
    });
  };

  render() {
    const {
      workspaceOptions,
      targetWorkspaceOption,
      isIncludeReferencesDeepChecked,
      allSelectedObjects,
    } = this.state;
    const { onClose } = this.props;
    const targetWorkspaceId = targetWorkspaceOption?.at(0)?.key;

    return (
      <EuiModal
        data-test-subj="savedObjectsDuplicateModal"
        className="savedObjectsModal"
        onClose={onClose}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.duplicateModal.title"
              defaultMessage="Copy {objectCount, plural, =1 {{objectName}} other {# {useUpdatedUX, select, true {assets} other {objects}}}} to another workspace?"
              values={{
                objectName: allSelectedObjects[0]?.meta.title,
                objectCount: allSelectedObjects.length,
                useUpdatedUX: this.props.useUpdatedUX,
              }}
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow
            fullWidth
            label={i18n.translate(
              'savedObjectsManagement.objectsTable.duplicateModal.targetWorkspaceLabel',
              { defaultMessage: 'Target workspace' }
            )}
          >
            <>
              <EuiComboBox
                options={workspaceOptions}
                onChange={this.onTargetWorkspaceChange}
                selectedOptions={targetWorkspaceOption}
                singleSelection={{ asPlainText: true }}
                isClearable={false}
                isInvalid={!targetWorkspaceId}
                placeholder="Select a workspace"
              />
            </>
          </EuiFormRow>

          <EuiSpacer />

          <EuiFormRow
            fullWidth
            label={i18n.translate(
              'savedObjectsManagement.objectsTable.duplicateModal.relatedObjects',
              {
                defaultMessage:
                  'Copy related {useUpdatedUX, select, true {assets} other {objects}}',
                values: {
                  useUpdatedUX: this.props.useUpdatedUX,
                },
              }
            )}
          >
            <>
              <EuiSpacer size="s" />
              <EuiCheckbox
                id={'includeReferencesDeep'}
                label={i18n.translate(
                  'savedObjectsManagement.objectsTable.duplicateModal.includeReferencesDeepLabel',
                  {
                    defaultMessage:
                      'Copy the selected {useUpdatedUX, select, true {asset} other {object}} and any related {useUpdatedUX, select, true {assets} other {objects}} (recommended).',
                    values: {
                      useUpdatedUX: this.props.useUpdatedUX,
                    },
                  }
                )}
                checked={isIncludeReferencesDeepChecked}
                onChange={this.changeIncludeReferencesDeep}
              />
            </>
          </EuiFormRow>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty data-test-subj="duplicateCancelButton" onClick={this.props.onClose}>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.duplicateModal.duplicateCancelButton"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>

          <EuiButton
            fill
            data-test-subj="duplicateConfirmButton"
            onClick={() => this.duplicateSavedObjects(allSelectedObjects)}
            isLoading={this.state.isLoading}
            disabled={!targetWorkspaceId}
          >
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.duplicateModal.confirmButtonLabel"
              defaultMessage="Copy"
            />
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
}
