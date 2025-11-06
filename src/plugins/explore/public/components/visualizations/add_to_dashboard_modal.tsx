/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './visualization_container.scss';
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
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState, useEffect } from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { DebouncedFieldText } from './style_panel/utils';
import { OnSaveProps } from './add_to_dashboard_button';
import { useSavedExplore } from '../../application/utils/hooks/use_saved_explore';
import { useExistingDashboard } from '../../application/utils/hooks/use_existing_dashboard';

interface AddToDashboardModalProps {
  savedObjectsClient: SavedObjectsClientContract;
  onConfirm: (props: OnSaveProps) => void;
  onCancel: () => void;
  savedExploreId: string | undefined;
}

export const AddToDashboardModal: React.FC<AddToDashboardModalProps> = ({
  savedExploreId,
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

  const { savedExplore } = useSavedExplore(savedExploreId);

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
    if (savedExplore) {
      await onConfirm({
        savedExplore,
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
              id="explore.addtoDashboardModal.duplicateTitleLabel"
              defaultMessage="This object already exists"
            />
          }
          color="warning"
          data-test-subj="titleDupicateWarnMsg"
        >
          <p>
            <FormattedMessage
              id="explore.addtoDashboardModal.duplicateTitleDescription"
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
          <h2 data-test-subj="addToDashboardModalTitle">
            {i18n.translate('explore.addtoDashboardModal.title', {
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
              label={i18n.translate('explore.addtoDashboardModal.saveToExisting', {
                defaultMessage: 'Save to existing dashboard',
              })}
              checked={selectedOption === 'existing'}
              onChange={(e) => setSelectedOption('existing')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiRadio
              id="saveToNewDashboard"
              data-test-subj="saveToNewDashboardRadio"
              label={i18n.translate('explore.addToNewDashboardModal.saveToNew', {
                defaultMessage: 'Save to new dashboard',
              })}
              checked={selectedOption === 'new'}
              onChange={(e) => setSelectedOption('new')}
            />
          </EuiFlexItem>

          {selectedOption === 'existing' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('explore.addtoDashboardModal.selectDashboard', {
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
                label={i18n.translate('explore.addtoDashboardModal.dashboardName', {
                  defaultMessage: 'Dashboard name',
                })}
              >
                <DebouncedFieldText
                  value={newDashboardName}
                  placeholder="Enter dashboard name"
                  onChange={(text) => {
                    setNewDashboardName(text);
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}
          {renderDuplicateTitleCallout()}

          <EuiFlexItem grow={true} style={{ width: '100%' }}>
            <EuiFormRow
              label={i18n.translate('explore.addtoDashboardModal.saveExploreName', {
                defaultMessage: 'Save search',
              })}
            >
              <DebouncedFieldText
                value={title}
                placeholder="Enter save search name"
                onChange={(text) => {
                  setIsTitleOrDashboardTitleDuplicate(false);
                  setTitle(text);
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty onClick={onCancel} data-test-subj="saveToDashboardCancelButton">
          {i18n.translate('explore.addtoDashboardModal.cancelButton', {
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
          {i18n.translate('explore.addtoDashboardModal.addButton', {
            defaultMessage: 'Add',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
