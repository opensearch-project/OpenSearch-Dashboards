/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiModal,
  EuiFlexItem,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiFlexGroup,
  EuiFormRow,
  EuiModalFooter,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiModalHeader,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { DebouncedFieldText } from '../../../components/visualizations/style_panel/utils';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';

import { SavedExplore } from '../../../saved_explore';

export interface OnSaveProps {
  savedExplore: SavedExplore;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
}

interface SaveVisModalProps {
  onConfirm: (props: OnSaveProps) => Promise<void>;
  onCancel: () => void;
  savedExploreId: string | undefined;
}

export const SaveVisModal: React.FC<SaveVisModalProps> = ({
  savedExploreId,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isTitleDuplicate, setIsTitleDuplicate] = useState<boolean>(false);

  const { savedExplore } = useSavedExplore(savedExploreId);

  const [title, setTitle] = useState<string>(savedExplore?.title ?? '');

  const enableButton = title !== '';

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    if (savedExplore) {
      await onConfirm({
        savedExplore,
        newTitle: title,
        isTitleDuplicateConfirmed: isTitleDuplicate,
        onTitleDuplicate: handleTitleDuplicate,
      });
    }
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
          <h2 data-test-subj="saveVisModalTitle">
            {i18n.translate('explore.saveVisModalTitle.title', {
              defaultMessage: 'Save and back to Dashboard',
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
          {renderDuplicateTitleCallout()}

          <EuiFlexItem grow={true} style={{ width: '100%' }}>
            <EuiFormRow
              label={i18n.translate('explore.saveVisModalTitle.saveExploreName', {
                defaultMessage: 'Name save search',
              })}
            >
              <DebouncedFieldText
                value={savedExplore?.title ?? ''}
                placeholder="Enter save search name"
                onChange={(text: string) => {
                  setIsTitleDuplicate(false);
                  setTitle(text);
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty
          onClick={onCancel}
          data-test-subj="saveVisandBackToDashboardCancelButton"
        >
          {i18n.translate('explore.saveVisModalTitle.saveVisandBackToDashboardCancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>

        <EuiSmallButton
          onClick={handleSave}
          type="submit"
          fill={true}
          disabled={!enableButton}
          isLoading={isLoading}
          data-test-subj="saveVisandBackToDashboardConfirmButton"
        >
          {i18n.translate('explore.saveVisModalTitle.saveVisandBackToDashboardConfirmButton', {
            defaultMessage: 'Save',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
