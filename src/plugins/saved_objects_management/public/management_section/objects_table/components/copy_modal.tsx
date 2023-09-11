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
import { groupBy } from 'lodash';
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
  EuiComboBoxOptionOption,
  EuiInMemoryTable,
  EuiToolTip,
  EuiIcon,
  EuiCallOut,
  EuiText,
} from '@elastic/eui';
import { WorkspaceAttribute, WorkspaceStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { SavedObjectWithMetadata } from '../../../types';
import { getSavedObjectLabel } from '../../../lib';
import { SAVED_OBJECT_TYPE_WORKSAPCE } from '../../../constants';
import { CopyState } from '../';

type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceAttribute>;

interface Props {
  workspaces: WorkspaceStart;
  onCopy: (
    savedObjects: SavedObjectWithMetadata[],
    includeReferencesDeep: boolean,
    targetWorkspace: string
  ) => Promise<void>;
  onClose: () => void;
  copyState: CopyState;
  getCopyWorkspaces: () => Promise<WorkspaceAttribute[]>;
  selectedSavedObjects: SavedObjectWithMetadata[];
}

interface State {
  allSelectedObjects: SavedObjectWithMetadata[];
  workspaceOptions: WorkspaceOption[];
  allWorkspaceOptions: WorkspaceOption[];
  targetWorkspaceOption: WorkspaceOption[];
  isLoading: boolean;
  isIncludeReferencesDeepChecked: boolean;
  savedObjectTypeInfoMap: Map<string, [number, boolean]>;
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export class SavedObjectsCopyModal extends React.Component<Props, State> {
  private isMounted = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      allSelectedObjects: this.props.selectedSavedObjects,
      workspaceOptions: [],
      allWorkspaceOptions: [],
      targetWorkspaceOption: [],
      isLoading: false,
      isIncludeReferencesDeepChecked: true,
      savedObjectTypeInfoMap: new Map<string, [number, boolean]>(),
    };
  }

  workspaceToOption = (
    workspace: WorkspaceAttribute,
    currentWorkspaceName?: string
  ): WorkspaceOption => {
    // add (current) after current workspace name
    let workspaceName = workspace.name;
    if (workspace.name === currentWorkspaceName) {
      workspaceName += ' (current)';
    }
    return {
      label: workspaceName,
      key: workspace.id,
      value: workspace,
    };
  };

  async componentDidMount() {
    const { workspaces, getCopyWorkspaces } = this.props;
    const workspaceList = await getCopyWorkspaces();
    const currentWorkspace = workspaces.currentWorkspace$.value;
    const currentWorkspaceName = currentWorkspace?.name;

    // current workspace is the first option
    const workspaceOptions = [
      ...(currentWorkspace ? [this.workspaceToOption(currentWorkspace, currentWorkspaceName)] : []),
      ...workspaceList
        .filter((workspace: WorkspaceAttribute) => workspace.name !== currentWorkspaceName)
        .map((workspace: WorkspaceAttribute) =>
          this.workspaceToOption(workspace, currentWorkspaceName)
        ),
    ];

    this.setState({
      workspaceOptions,
      allWorkspaceOptions: workspaceOptions,
    });

    const { copyState } = this.props;
    if (copyState === CopyState.All) {
      const { allSelectedObjects } = this.state;
      const categorizedObjects = groupBy(allSelectedObjects, (object) => object.type);
      const savedObjectTypeInfoMap = new Map<string, [number, boolean]>();
      for (const [savedObjectType, savedObjects] of Object.entries(categorizedObjects)) {
        savedObjectTypeInfoMap.set(savedObjectType, [savedObjects.length, true]);
      }
      this.setState({ savedObjectTypeInfoMap });
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

  changeIncludeSavedObjectType = (savedObjectType: string) => {
    const { savedObjectTypeInfoMap } = this.state;
    const savedObjectTypeInfo = savedObjectTypeInfoMap.get(savedObjectType);
    if (savedObjectTypeInfo) {
      const [count, checked] = savedObjectTypeInfo;
      savedObjectTypeInfoMap.set(savedObjectType, [count, !checked]);
      this.setState({ savedObjectTypeInfoMap });
    }
  };

  renderCopyObjectCategory = (
    savedObjectType: string,
    savedObjectTypeCount: number,
    savedObjectTypeChecked: boolean
  ) => {
    return (
      <EuiCheckbox
        id={'includeSavedObjectType.' + savedObjectType}
        key={savedObjectType}
        label={
          <FormattedMessage
            id={'savedObjectsManagement.objectsTable.copyModal.savedObjectType.' + savedObjectType}
            defaultMessage={
              capitalizeFirstLetter(savedObjectType) + ` (${savedObjectTypeCount.toString()})`
            }
          />
        }
        checked={savedObjectTypeChecked}
        onChange={() => this.changeIncludeSavedObjectType(savedObjectType)}
      />
    );
  };

  renderCopyObjectCategories = () => {
    const { savedObjectTypeInfoMap } = this.state;
    const checkboxList: JSX.Element[] = [];
    savedObjectTypeInfoMap.forEach(
      ([savedObjectTypeCount, savedObjectTypeChecked], savedObjectType) =>
        checkboxList.push(
          this.renderCopyObjectCategory(
            savedObjectType,
            savedObjectTypeCount,
            savedObjectTypeChecked
          )
        )
    );
    return checkboxList;
  };

  isSavedObjectTypeIncluded = (savedObjectType: string) => {
    const { savedObjectTypeInfoMap } = this.state;
    const savedObjectTypeInfo = savedObjectTypeInfoMap.get(savedObjectType);
    return savedObjectTypeInfo && savedObjectTypeInfo[1];
  };

  render() {
    const {
      workspaceOptions,
      targetWorkspaceOption,
      isIncludeReferencesDeepChecked,
      allSelectedObjects,
    } = this.state;
    const { copyState } = this.props;
    const targetWorkspaceId = targetWorkspaceOption?.at(0)?.key;
    let selectedObjects = allSelectedObjects;
    if (copyState === CopyState.All) {
      selectedObjects = selectedObjects.filter((item) => this.isSavedObjectTypeIncluded(item.type));
    }
    const includedSelectedObjects = selectedObjects.filter((item) =>
      !!targetWorkspaceId && !!item.workspaces
        ? !item.workspaces.includes(targetWorkspaceId)
        : item.type !== SAVED_OBJECT_TYPE_WORKSAPCE
    );

    const ignoredSelectedObjectsLength = selectedObjects.length - includedSelectedObjects.length;

    let confirmCopyButtonEnabled = false;
    if (!!targetWorkspaceId && includedSelectedObjects.length > 0) {
      confirmCopyButtonEnabled = true;
    }

    const confirmMessageForAllObjects = `Duplicate (${includedSelectedObjects.length})`;
    const confirmMessageForSingleOrSelectedObjects = 'Duplicate';
    const confirmMessage =
      copyState === CopyState.All
        ? confirmMessageForAllObjects
        : confirmMessageForSingleOrSelectedObjects;
    const warningMessageForOnlyOneSavedObject = (
      <p>
        <b style={{ color: '#000' }}>1</b> saved object will <b style={{ color: '#000' }}>not</b> be
        copied, because it has already existed in the selected workspace or it is worksapce itself.
      </p>
    );
    const warningMessageForMultipleSavedObjects = (
      <p>
        <b style={{ color: '#000' }}>{ignoredSelectedObjectsLength}</b> saved objects will{' '}
        <b style={{ color: '#000' }}>not</b> be copied, because they have already existed in the
        selected workspace or they are workspaces themselves.
      </p>
    );

    const ignoreSomeObjectsChildren: React.ReactChild = (
      <>
        <EuiCallOut
          title="Some saved objects will be ignored."
          color="warning"
          iconType="help"
          aria-disabled={ignoredSelectedObjectsLength === 0}
        >
          {ignoredSelectedObjectsLength === 1
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
              defaultMessage="Duplicate {copyState, select, all {all objects} other {{objectCount, plural, =1 {{objectName}} other {# objects}}}}?"
              values={{
                copyState,
                objectName: allSelectedObjects[0].meta.title,
                objectCount: allSelectedObjects.length,
              }}
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow
            fullWidth
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.copyModal.targetWorkspacelabel"
                defaultMessage="Destination workspace"
              />
            }
          >
            <>
              <EuiText size="s" color="subdued">
                {'Specify a workspace where the objects will be duplicated.'}
              </EuiText>
              <EuiSpacer size="s" />
              <EuiComboBox
                options={workspaceOptions}
                onChange={this.onTargetWorkspaceChange}
                selectedOptions={targetWorkspaceOption}
                singleSelection={{ asPlainText: true }}
                onSearchChange={this.onSearchWorkspaceChange}
                isClearable={false}
                isInvalid={!confirmCopyButtonEnabled}
              />
            </>
          </EuiFormRow>

          <EuiSpacer size="m" />
          {copyState && this.renderCopyObjectCategories()}
          {copyState && <EuiSpacer size="m" />}

          <EuiFormRow
            fullWidth
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.copyModal.relatedObjects"
                defaultMessage="Related Objects"
              />
            }
          >
            <>
              <EuiText size="s" color="subdued">
                {
                  'We recommended duplicating related objects to ensure your duplicated objects will continue to function.'
                }
              </EuiText>
              <EuiSpacer size="s" />
              <EuiCheckbox
                id={'includeReferencesDeep'}
                label={
                  <FormattedMessage
                    id="savedObjectsManagement.objectsTable.copyModal.includeReferencesDeepLabel"
                    defaultMessage="Duplicate related objects"
                  />
                }
                checked={isIncludeReferencesDeepChecked}
                onChange={this.changeIncludeReferencesDeep}
              />
            </>
          </EuiFormRow>

          <EuiSpacer size="m" />
          {ignoredSelectedObjectsLength === 0 ? null : ignoreSomeObjectsChildren}
          <p>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.tableTitle"
              defaultMessage="The following saved objects will be copied:"
            />
          </p>
          <EuiSpacer size="m" />
          <EuiInMemoryTable
            items={includedSelectedObjects}
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
            onClick={() => this.copySavedObjects(includedSelectedObjects)}
            isLoading={this.state.isLoading}
            disabled={!confirmCopyButtonEnabled}
          >
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.copyModal.confirmButtonLabel"
              defaultMessage={confirmMessage}
            />
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
}
