/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiModal,
  EuiFlexItem,
  EuiModalHeaderTitle,
  EuiSelect,
  EuiModalBody,
  EuiFlexGroup,
  EuiFormRow,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiModalHeader,
  EuiRadio,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useEffect, useState } from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { OnSaveProps, DashboardInterface } from './add_to_dashboard_button';

interface AddToDashboardModalProps {
  visualizationData: any;
  savedObjectsClient: SavedObjectsClientContract;
  onConfirm: (props: OnSaveProps) => void;
  onCancel: () => void;
}

export const AddToDashboardModal: React.FC<AddToDashboardModalProps> = ({
  visualizationData,
  savedObjectsClient,
  onConfirm,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing');
  const [existingDashboards, setExistingDashboards] = useState<DashboardInterface[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardInterface | null>(null);
  const [newDashboardName, setNewDashboardName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTitleDuplicate, setIsTitleDuplicate] = useState<boolean>(false);

  const enableButton =
    title &&
    ((selectedOption === 'existing' && selectedDashboard) ||
      (selectedOption === 'new' && newDashboardName));

  useEffect(() => {
    const loadAllDashboards = async () => {
      try {
        const res = await savedObjectsClient.find({
          type: 'dashboard',
          perPage: 100,
        });
        const dashboards = res.savedObjects;
        setExistingDashboards(dashboards as DashboardInterface[]);
        setSelectedDashboard(dashboards.length > 0 ? (dashboards[0] as DashboardInterface) : null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load dashboards:', error);
      }
    };

    if (selectedOption === 'existing') {
      loadAllDashboards();
    }
  }, [savedObjectsClient, selectedOption]);

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);

    await onConfirm({
      visualizationData,
      newTitle: title,
      isTitleDuplicateConfirmed: isTitleDuplicate,
      onTitleDuplicate: handleTitleDuplicate,
      mode: selectedOption,
      selectDashboard: selectedDashboard,
      newDashboardName,
    });
  };

  const handleTitleDuplicate = () => {
    setIsLoading(false);
    setIsTitleDuplicate(true);
  };

  const renderDuplicateTitleCallout = () => {
    if (!isTitleDuplicate) {
      return null;
    }

    return (
      <EuiFlexItem style={{ width: '100%' }}>
        <EuiCallOut
          title={
            <FormattedMessage
              id="chat.addToDashboardModal.duplicateTitleLabel"
              defaultMessage="This object already exists"
            />
          }
          color="warning"
          data-test-subj="titleDuplicateWarnMsg"
        >
          <p>
            <FormattedMessage
              id="chat.addToDashboardModal.duplicateTitleDescription"
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
            {i18n.translate('chat.addToDashboardModal.title', {
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
              label={i18n.translate('chat.addToDashboardModal.saveToExisting', {
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
              label={i18n.translate('chat.addToNewDashboardModal.saveToNew', {
                defaultMessage: 'Save to new dashboard',
              })}
              checked={selectedOption === 'new'}
              onChange={() => setSelectedOption('new')}
            />
          </EuiFlexItem>

          {existingDashboards.length > 0 && selectedOption === 'existing' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('chat.addToDashboardModal.selectDashboard', {
                  defaultMessage: 'Select a dashboard',
                })}
              >
                <EuiSelect
                  data-test-subj="selectExistingDashboard"
                  compressed={true}
                  fullWidth={true}
                  options={existingDashboards.map((dashboard) => {
                    return {
                      value: dashboard.id,
                      text: dashboard.attributes?.title || dashboard.id,
                    };
                  })}
                  value={selectedDashboard?.id}
                  onChange={(e) => {
                    const selected = existingDashboards.find((d) => d.id === e.target.value);
                    if (selected) {
                      setSelectedDashboard(selected);
                    }
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}

          {selectedOption === 'new' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('chat.addToDashboardModal.dashboardName', {
                  defaultMessage: 'Dashboard name',
                })}
              >
                <EuiFieldText
                  value={newDashboardName}
                  placeholder="Enter dashboard name"
                  onChange={(e) => {
                    setNewDashboardName(e.target.value);
                  }}
                  fullWidth
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}

          <EuiSpacer size="m" />
          {renderDuplicateTitleCallout()}

          <EuiFlexItem grow={true} style={{ width: '100%' }}>
            <EuiFormRow
              label={i18n.translate('chat.addToDashboardModal.visualizationName', {
                defaultMessage: 'Visualization name',
              })}
            >
              <EuiFieldText
                value={title}
                placeholder="Enter visualization name"
                onChange={(e) => {
                  setIsTitleDuplicate(false);
                  setTitle(e.target.value);
                }}
                fullWidth
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel} data-test-subj="saveToDashboardCancelButton">
          {i18n.translate('chat.addToDashboardModal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiButtonEmpty>

        <EuiButton
          onClick={handleSave}
          fill={true}
          disabled={!enableButton}
          isLoading={isLoading}
          data-test-subj="saveToDashboardConfirmButton"
        >
          {i18n.translate('chat.addToDashboardModal.addButton', {
            defaultMessage: 'Add',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
