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
  EuiText,
} from '@elastic/eui';
import { HttpSetup, NotificationsStart, WorkspacesStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { WorkspaceOption, getTargetWorkspacesOptions, workspaceToOption } from './utils';
import { DuplicateObject } from '../../types';

export interface Props {
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
}

interface State {
  allSelectedObjects: DuplicateObject[];
  workspaceOptions: WorkspaceOption[];
  targetWorkspaceOption: WorkspaceOption[];
  isLoading: boolean;
  isIncludeReferencesDeepChecked: boolean;
}

export class SavedObjectsDuplicateModal extends React.Component<Props, State> {
  private isMounted = false;

  constructor(props: Props) {
    super(props);

    const { workspaces } = props;
    const currentWorkspace = workspaces.currentWorkspace$.value;
    const currentWorkspaceId = currentWorkspace?.id;
    const targetWorkspacesOptions = getTargetWorkspacesOptions(workspaces, currentWorkspaceId);

    this.state = {
      allSelectedObjects: props.selectedSavedObjects,
      // current workspace is the first option
      workspaceOptions: [
        ...(currentWorkspace ? [workspaceToOption(currentWorkspace, currentWorkspaceId)] : []),
        ...targetWorkspacesOptions,
      ],
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
    this.setState({
      isLoading: true,
    });

    const targetWorkspace = this.state.targetWorkspaceOption[0].key;
    const targetWorkspaceName = this.state.targetWorkspaceOption[0].label;

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

  changeIncludeReferencesDeep = () => {
    this.setState((state) => ({
      isIncludeReferencesDeepChecked: !state.isIncludeReferencesDeepChecked,
    }));
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
              defaultMessage="Duplicate {objectCount, plural, =1 {{objectName}} other {# objects}} to?"
              values={{
                objectName: allSelectedObjects[0].meta.title,
                objectCount: allSelectedObjects.length,
              }}
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow
            fullWidth
            label={i18n.translate(
              'savedObjectsManagement.objectsTable.duplicateModal.targetWorkspacelabel',
              { defaultMessage: 'Workspace' }
            )}
          >
            <>
              <EuiText size="s" color="subdued">
                {i18n.translate(
                  'savedObjectsManagement.objectsTable.duplicateModal.targetWorkspaceNotice',
                  { defaultMessage: 'Select a workspace to where the object(s) will be duplicated' }
                )}
              </EuiText>
              <EuiSpacer size="s" />
              <EuiComboBox
                options={workspaceOptions}
                onChange={this.onTargetWorkspaceChange}
                selectedOptions={targetWorkspaceOption}
                singleSelection={{ asPlainText: true }}
                isClearable={false}
                isInvalid={!targetWorkspaceId}
                placeholder="select a workspace"
              />
            </>
          </EuiFormRow>

          <EuiSpacer />

          <EuiFormRow
            fullWidth
            label={i18n.translate(
              'savedObjectsManagement.objectsTable.duplicateModal.relatedObjects',
              { defaultMessage: 'Options' }
            )}
          >
            <>
              <EuiText size="s" color="subdued">
                {i18n.translate(
                  'savedObjectsManagement.objectsTable.duplicateModal.relatedObjectsNotice',
                  {
                    defaultMessage:
                      'Include related saved objects to ensure object(s) work as expected',
                  }
                )}
              </EuiText>
              <EuiSpacer size="s" />
              <EuiCheckbox
                id={'includeReferencesDeep'}
                label={i18n.translate(
                  'savedObjectsManagement.objectsTable.duplicateModal.includeReferencesDeepLabel',
                  { defaultMessage: 'Include related objects(recommended)' }
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
              defaultMessage="Duplicate"
              values={{
                objectCount: allSelectedObjects.length,
              }}
            />
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
}
