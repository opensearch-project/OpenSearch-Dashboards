/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import {
  EuiModal,
  EuiFlexItem,
  EuiModalHeaderTitle,
  EuiComboBox,
  EuiModalBody,
  EuiFlexGroup,
  EuiFormRow,
  EuiModalFooter,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiModalHeader,
  EuiRadio,
  EuiFieldText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState, useEffect } from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { OnSaveProps } from './add_to_dashboard_button';
import { useSavedAgentTraces } from '../../application/utils/hooks/use_saved_agent_traces';
import { useExistingDashboard } from '../../application/utils/hooks/use_existing_dashboard';

interface AddToDashboardModalProps {
  savedObjectsClient: SavedObjectsClientContract;
  onConfirm: (props: OnSaveProps) => void;
  onCancel: () => void;
  savedAgentTracesId: string | undefined;
}

export const AddToDashboardModal: React.FC<AddToDashboardModalProps> = ({
  savedAgentTracesId,
  savedObjectsClient,
  onConfirm,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing');
  const [newDashboardName, setNewDashboardName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isTitleOrDashboardTitleDuplicate, setIsTitleOrDashboardTitleDuplicate] = useState<boolean>(
    false
  );

  const { savedAgentTraces } = useSavedAgentTraces(savedAgentTracesId);

  const [title, setTitle] = useState<string>('');

  // Dashboard-related state managed by custom hook
  const {
    dashboardsToShow,
    selectedDashboard,
    isSearching,
    setSelectedDashboard,
    searchDashboards,
    loadAllDashboards,
  } = useExistingDashboard(savedObjectsClient);

  // Load dashboards on mount and when switching to existing option
  useEffect(() => {
    if (selectedOption === 'existing') {
      loadAllDashboards();
    }
  }, [selectedOption, loadAllDashboards]);

  const enableButton =
    title &&
    ((selectedOption === 'existing' && selectedDashboard) ||
      (selectedOption === 'new' && newDashboardName));

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    if (savedAgentTraces) {
      await onConfirm({
        savedAgentTraces,
        newTitle: title,
        isTitleDuplicateConfirmed: isTitleOrDashboardTitleDuplicate,
        onTitleDuplicate: handleTitleDuplicate,
        mode: selectedOption,
        selectDashboard: selectedDashboard,
        newDashboardName,
      });
    }
  };

  const handleTitleDuplicate = () => {
    setIsLoading(false);
    setIsTitleOrDashboardTitleDuplicate(true);
  };

  const renderDuplicateTitleCallout = () => {
    if (!isTitleOrDashboardTitleDuplicate) {
      return null;
    }

    return (
      <EuiFlexItem style={{ width: '100%' }}>
        <EuiCallOut
          title={
            <FormattedMessage
              id="agentTraces.addtoDashboardModal.duplicateTitleLabel"
              defaultMessage="This object already exists"
            />
          }
          color="warning"
          data-test-subj="titleDupicateWarnMsg"
        >
          <p>
            <FormattedMessage
              id="agentTraces.addtoDashboardModal.duplicateTitleDescription"
              defaultMessage="Saving '{title}' creates a duplicate title."
              values={{
                title,
              }}
            />
          </p>
        </EuiCallOut>
      </EuiFlexItem>
    );
  };

  return (
    <EuiModal style={{ minWidth: 400 }} onClose={onCancel}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h2 data-test-subj="agentTracesAddToDashboardModalTitle">
            {i18n.translate('agentTraces.addtoDashboardModal.title', {
              defaultMessage: 'Save and Add to Dashboard',
            })}
          </h2>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFlexGroup
          direction="column"
          justifyContent="center"
          alignItems="flexStart"
          gutterSize="s"
        >
          <EuiFlexItem grow={false}>
            <EuiRadio
              id="saveToExistingDashboard"
              data-test-subj="saveToExistingDashboardRadio"
              label={i18n.translate('agentTraces.addtoDashboardModal.saveToExisting', {
                defaultMessage: 'Save to existing dashboard',
              })}
              checked={selectedOption === 'existing'}
              onChange={() => setSelectedOption('existing')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiRadio
              id="saveToNewDashboard"
              data-test-subj="saveToNewDashboardRadio"
              label={i18n.translate('agentTraces.addToNewDashboardModal.saveToNew', {
                defaultMessage: 'Save to new dashboard',
              })}
              checked={selectedOption === 'new'}
              onChange={() => setSelectedOption('new')}
            />
          </EuiFlexItem>

          {selectedOption === 'existing' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('agentTraces.addtoDashboardModal.selectDashboard', {
                  defaultMessage: 'Select a dashboard',
                })}
              >
                <EuiComboBox
                  data-test-subj="selectExistingDashboard"
                  compressed={true}
                  fullWidth={true}
                  placeholder="Search and select a dashboard"
                  singleSelection={{ asPlainText: true }}
                  options={dashboardsToShow.map((dashboard) => {
                    return {
                      label: dashboard.attributes?.title || dashboard.id,
                      value: dashboard.id,
                    };
                  })}
                  selectedOptions={
                    selectedDashboard
                      ? [
                          {
                            label: selectedDashboard.attributes?.title || selectedDashboard.id,
                            value: selectedDashboard.id,
                          },
                        ]
                      : []
                  }
                  onChange={(selectedOptions) => {
                    if (selectedOptions.length > 0) {
                      const selectedValue = selectedOptions[0].value;
                      const selected = dashboardsToShow.find((d) => d.id === selectedValue);
                      if (selected) {
                        setSelectedDashboard(selected);
                      }
                    } else {
                      setSelectedDashboard(null);
                    }
                  }}
                  onSearchChange={(searchTerm) => {
                    searchDashboards(searchTerm);
                  }}
                  isLoading={isSearching}
                  isClearable={true}
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}

          {selectedOption === 'new' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('agentTraces.addtoDashboardModal.dashboardName', {
                  defaultMessage: 'Dashboard name',
                })}
              >
                <EuiFieldText
                  value={newDashboardName}
                  placeholder="Enter dashboard name"
                  onChange={(e) => {
                    setNewDashboardName(e.target.value);
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}
          {renderDuplicateTitleCallout()}

          <EuiFlexItem grow={true} style={{ width: '100%' }}>
            <EuiFormRow
              label={i18n.translate('agentTraces.addtoDashboardModal.saveSearchName', {
                defaultMessage: 'Save search',
              })}
            >
              <EuiFieldText
                value={title}
                placeholder="Enter save search name"
                onChange={(e) => {
                  setIsTitleOrDashboardTitleDuplicate(false);
                  setTitle(e.target.value);
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty onClick={onCancel} data-test-subj="saveToDashboardCancelButton">
          {i18n.translate('agentTraces.addtoDashboardModal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>

        <EuiSmallButton
          onClick={handleSave}
          type="submit"
          fill={true}
          disabled={!enableButton}
          isLoading={isLoading}
          data-test-subj="saveToDashboardConfirmButton"
        >
          {i18n.translate('agentTraces.addtoDashboardModal.addButton', {
            defaultMessage: 'Add',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
