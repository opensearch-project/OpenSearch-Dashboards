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
  EuiText,
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
import { DebouncedText } from './style_panel/utils';
import { SavedExplore } from '../../saved_explore';
import { OnSaveProps, DashboardInterface } from './add_to_dashboard_button';

interface AddToDashboardModalProps {
  savedObjectsClient: SavedObjectsClientContract;
  onConfirm: (props: OnSaveProps) => void;
  onCancel: () => void;
  savedExplore?: SavedExplore;
}

export const AddToDashboardModal: React.FC<AddToDashboardModalProps> = ({
  savedExplore,
  savedObjectsClient,
  onConfirm,
  onCancel,
}) => {
  const [isSaveExploreExisting] = useState<boolean>(savedExplore?.id ? true : false);
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing');
  const [existingDashboard, setExistingDashboard] = useState<DashboardInterface[]>([]);
  const [selectDashboard, setSelectDashboard] = useState<DashboardInterface | null>(null);
  const [newDashboardName, setNewDashboardName] = useState<string>('');
  const [isLoading, setisLoading] = useState<boolean>(false);

  const [isTitleDupilcate, setIsTitleDuplicate] = useState<boolean>(false);
  const [isDashboardDuplicate, setIsDashboardDuplicate] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(savedExplore?.title || '');

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
      setSelectDashboard(
        dashboards.length > 0 ? (res.savedObjects[0] as DashboardInterface) : null
      );
    };
    if (selectedOption === 'existing') {
      loadAllDashboards();
    }
  }, [savedObjectsClient, selectedOption]);

  const handleSave = async () => {
    if (isLoading) return;
    setisLoading(true);
    await onConfirm({
      savedExplore,
      newTitle: title,
      isTitleDuplicateConfirmed: isTitleDupilcate,
      onTitleDuplicate: handleTitleDuplicate,
      mode: selectedOption,
      selectDashboard,
      newDashboardName,
      isDashboardDuplicateConfirmed: isDashboardDuplicate,
      onDashboardDuplicate: handleDashboardDuplicate,
    });
  };

  const handleTitleDuplicate = () => {
    setisLoading(false);
    setIsTitleDuplicate(true);
  };

  const handleDashboardDuplicate = () => {
    setisLoading(false);
    setIsDashboardDuplicate(true);
  };

  const renderDuplicateTitleCallout = () => {
    if (!isTitleDupilcate) {
      return null;
    }

    return (
      <EuiFlexItem style={{ width: '100%' }}>
        <EuiCallOut
          title={
            <FormattedMessage
              id="explore.addtoDashboardModal.duplicateTitleLabel"
              defaultMessage="This {objectType} already exists"
              values={{ objectType: savedExplore?.getOpenSearchType() }}
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

  const renderDuplicateDashboardCallout = () => {
    if (!isDashboardDuplicate) {
      return null;
    }
    return (
      <EuiFlexItem style={{ width: '100%' }}>
        <EuiCallOut
          title={
            <FormattedMessage
              id="explore.addtoDashboardModal.duplicateDashboardTitleLabel"
              defaultMessage="This dashboard already exists"
            />
          }
          color="warning"
          data-test-subj="dashboardTitleDupicateWarnMsg"
        >
          <p>
            <FormattedMessage
              id="explore.addtoDashboardModal.duplicateDashboardTitleDescription"
              defaultMessage="Saving '{newDashboardName}' creates a duplicate title."
              values={{
                newDashboardName,
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
          <h2>
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
              <DebouncedText
                value={newDashboardName}
                placeholder="Enter Dashboard name"
                onChange={(text) => {
                  setNewDashboardName(text);
                }}
                label={i18n.translate('explore.addtoDashboardModal.dashboardName', {
                  defaultMessage: 'Dashboard name',
                })}
              />
            </EuiFlexItem>
          )}
          {renderDuplicateTitleCallout()}
          {renderDuplicateDashboardCallout()}

          {!isSaveExploreExisting && (
            <EuiFlexItem grow={true} style={{ width: '100%' }}>
              <DebouncedText
                value={title}
                placeholder="Save Explore name"
                onChange={(text) => {
                  setIsTitleDuplicate(false);
                  setTitle(text);
                }}
                label={i18n.translate('explore.addtoDashboardModal.saveExploreName', {
                  defaultMessage: 'Save Explore name',
                })}
              />
            </EuiFlexItem>
          )}
          {isSaveExploreExisting && (
            <EuiFlexItem grow={true} style={{ width: '100%' }}>
              <EuiText
                size="xs"
                color="subdued"
              >{`it will update the existing save explore ${savedExplore?.title}`}</EuiText>{' '}
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty onClick={onCancel}>
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
        >
          {i18n.translate('explore.addtoDashboardModal.addButton', {
            defaultMessage: 'Add',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
