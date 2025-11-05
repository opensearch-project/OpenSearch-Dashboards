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
  EuiSelect,
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
import React, { useEffect, useState } from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { DebouncedFieldText } from './style_panel/utils';
import { OnSaveProps, DashboardInterface } from './add_to_dashboard_button';
import { useSavedExplore } from '../../application/utils/hooks/use_saved_explore';

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
  const [existingDashboard, setExistingDashboard] = useState<DashboardInterface[]>([]);
  const [selectDashboard, setSelectDashboard] = useState<DashboardInterface | null>(null);
  const [newDashboardName, setNewDashboardName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isTitleOrDashboardTitleDuplicate, setIsTitleOrDashboardTitleDuplicate] = useState<boolean>(
    false
  );

  const { savedExplore } = useSavedExplore(savedExploreId);

  const [title, setTitle] = useState<string>('');

  const enableButton =
    title &&
    ((selectedOption === 'existing' && selectDashboard) ||
      (selectedOption === 'new' && newDashboardName));

  useEffect(() => {
    const loadAllDashboards = async () => {
      const res = await savedObjectsClient.find({
        type: 'dashboard',
      });
      const dashboards = res.savedObjects;
      setExistingDashboard(dashboards as DashboardInterface[]);
      setSelectDashboard(dashboards.length > 0 ? (dashboards[0] as DashboardInterface) : null);
    };
    if (selectedOption === 'existing') {
      loadAllDashboards();
    }
  }, [savedObjectsClient, selectedOption]);

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
        selectDashboard,
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

          {existingDashboard.length > 0 && selectedOption === 'existing' && (
            <EuiFlexItem style={{ width: '100%' }}>
              <EuiFormRow
                label={i18n.translate('explore.addtoDashboardModal.selectDashboard', {
                  defaultMessage: 'Select a dashboard',
                })}
              >
                <EuiSelect
                  data-test-subj="selectExistingDashboard"
                  compressed={true}
                  fullWidth={true}
                  options={existingDashboard.map((dashboard) => {
                    return {
                      value: dashboard.id,
                      text: dashboard.attributes?.title || dashboard.id,
                    };
                  })}
                  value={selectDashboard?.id}
                  onChange={(e) => {
                    const selected = existingDashboard.find((d) => d.id === e.target.value);
                    if (selected) {
                      setSelectDashboard(selected);
                    }
                  }}
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
