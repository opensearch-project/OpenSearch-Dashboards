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
  EuiSwitch,
  EuiComboBoxOptionOption,
  EuiInMemoryTable,
  EuiToolTip,
  EuiIcon,
  EuiCallOut,
} from '@elastic/eui';
import { WorkspaceAttribute, WorkspaceStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { SavedObjectWithMetadata } from '../../../types';
import { getSavedObjectLabel } from '../../../lib';
import { SAVED_OBJECT_TYPE_WORKSAPCE } from '../../../constants';

type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceAttribute>;

interface Props {
  workspaces: WorkspaceStart;
  onCopy: (
    savedObjects: SavedObjectWithMetadata[],
    includeReferencesDeep: boolean,
    targetWorkspace: string
  ) => Promise<void>;
  onClose: () => void;
  seletedSavedObjects: SavedObjectWithMetadata[];
}

interface State {
  allSeletedObjects: SavedObjectWithMetadata[];
  workspaceOptions: WorkspaceOption[];
  allWorkspaceOptions: WorkspaceOption[];
  targetWorkspaceOption: WorkspaceOption[];
  isLoading: boolean;
  isIncludeReferencesDeepChecked: boolean;
}

export class SavedObjectsCopyModal extends React.Component<Props, State> {
  private isMounted = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      allSeletedObjects: this.props.seletedSavedObjects,
      workspaceOptions: [],
      allWorkspaceOptions: [],
      targetWorkspaceOption: [],
      isLoading: false,
      isIncludeReferencesDeepChecked: true,
    };
  }

  workspaceToOption = (workspace: WorkspaceAttribute): WorkspaceOption => {
    return { label: workspace.name, key: workspace.id, value: workspace };
  };

  async componentDidMount() {
    const { workspaces } = this.props;
    const workspaceList = workspaces.workspaceList$;
    const currentWorkspace = workspaces.currentWorkspace$;

    if (!!currentWorkspace?.value?.name) {
      const currentWorkspaceName = currentWorkspace.value.name;
      const filteredWorkspaceOptions = workspaceList.value
        .map(this.workspaceToOption)
        .filter((item) => item.label !== currentWorkspaceName);
      this.setState({
        workspaceOptions: filteredWorkspaceOptions,
        allWorkspaceOptions: filteredWorkspaceOptions,
      });
    } else {
      const allWorkspaceOptions = workspaceList.value.map(this.workspaceToOption);
      this.setState({
        workspaceOptions: allWorkspaceOptions,
        allWorkspaceOptions,
      });
    }

    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  copySavedObjects = async (savedObjects: SavedObjectWithMetadata[]) => {
    this.setState({
      isLoading: true,
    });

    const targetWorkspace = this.state.targetWorkspaceOption[0].key;

    await this.props.onCopy(
      savedObjects,
      this.state.isIncludeReferencesDeepChecked,
      targetWorkspace!
    );

    if (this.isMounted) {
      this.setState({
        isLoading: false,
      });
    }
  };

  onSearchWorkspaceChange = (searchValue: string) => {
    this.setState({
      workspaceOptions: this.state.allWorkspaceOptions.filter((item) =>
        item.label.includes(searchValue)
      ),
    });
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
      allSeletedObjects,
    } = this.state;
    const targetWorkspaceId = targetWorkspaceOption?.at(0)?.key;
    const includedSeletedObjects = allSeletedObjects.filter((item) =>
      !!targetWorkspaceId && !!item.workspaces
        ? !item.workspaces.includes(targetWorkspaceId)
        : true && item.type !== SAVED_OBJECT_TYPE_WORKSAPCE
    );
    const ignoredSeletedObjectsLength = allSeletedObjects.length - includedSeletedObjects.length;

    let confirmCopyButtonEnabled = false;
    if (!!targetWorkspaceId && includedSeletedObjects.length > 0) {
      confirmCopyButtonEnabled = true;
    }

    const warningMessageForOnlyOneSavedObject = (
      <p>
        <b style={{ color: '#000' }}>1</b> saved object will <b style={{ color: '#000' }}>not</b> be
        copied, because it has already existed in the selected workspace or it is worksapce itself.
      </p>
    );
    const warningMessageForMultipleSavedObjects = (
      <p>
        <b style={{ color: '#000' }}>{ignoredSeletedObjectsLength}</b> saved objects will{' '}
        <b style={{ color: '#000' }}>not</b> be copied, because they have already existed in the
        selected workspace or they are worksapces themselves.
      </p>
    );

    const ignoreSomeObjectsChildren: React.ReactChild = (
      <>
        <EuiCallOut
          title="Some saved objects will be ignored."
          color="warning"
          iconType="help"
          aria-disabled={ignoredSeletedObjectsLength === 0}
        >
          {ignoredSeletedObjectsLength === 1
            ? warningMessageForOnlyOneSavedObject
            : warningMessageForMultipleSavedObjects}
        </EuiCallOut>
        <EuiSpacer />
      </>
    );

    return (
      <EuiModal
        data-test-subj="savedObjectsCopyModal"
        className="savedObjectsModal"
        onClose={this.props.onClose}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.title"
              defaultMessage="Copy saved objects"
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow
            fullWidth
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.copyModal.targetWorkspacelabel"
                defaultMessage="Select a workspace to copy to"
              />
            }
          >
            <EuiComboBox
              options={workspaceOptions}
              onChange={this.onTargetWorkspaceChange}
              selectedOptions={targetWorkspaceOption}
              singleSelection={{ asPlainText: true }}
              onSearchChange={this.onSearchWorkspaceChange}
              isClearable={false}
              isInvalid={!confirmCopyButtonEnabled}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />
          <EuiSwitch
            name="includeReferencesDeep"
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.copyModal.includeReferencesDeepLabel"
                defaultMessage="Include related objects"
              />
            }
            checked={isIncludeReferencesDeepChecked}
            onChange={this.changeIncludeReferencesDeep}
          />

          <EuiSpacer size="m" />
          {ignoredSeletedObjectsLength === 0 ? null : ignoreSomeObjectsChildren}
          <p>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.tableTitle"
              defaultMessage="The following saved objects will be copied:"
            />
          </p>
          <EuiSpacer size="m" />
          <EuiInMemoryTable
            items={includedSeletedObjects}
            columns={[
              {
                field: 'type',
                name: i18n.translate(
                  'savedObjectsManagement.objectsTable.copyModal.typeColumnName',
                  { defaultMessage: 'Type' }
                ),
                width: '50px',
                render: (type, object) => (
                  <EuiToolTip position="top" content={getSavedObjectLabel(type)}>
                    <EuiIcon type={object.meta.icon || 'apps'} />
                  </EuiToolTip>
                ),
              },
              {
                field: 'id',
                name: i18n.translate('savedObjectsManagement.objectsTable.copyModal.idColumnName', {
                  defaultMessage: 'Id',
                }),
              },
              {
                field: 'meta.title',
                name: i18n.translate(
                  'savedObjectsManagement.objectsTable.copyModal.titleColumnName',
                  { defaultMessage: 'Title' }
                ),
              },
            ]}
            pagination={true}
            sorting={false}
          />
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty data-test-subj="copyCancelButton" onClick={this.props.onClose}>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.copyCancelButton"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>

          <EuiButton
            fill
            data-test-subj="copyConfirmButton"
            onClick={() => this.copySavedObjects(includedSeletedObjects)}
            isLoading={this.state.isLoading}
            disabled={!confirmCopyButtonEnabled}
          >
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.confirmButtonLabel"
              defaultMessage="Confirm copy"
            />
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
}
