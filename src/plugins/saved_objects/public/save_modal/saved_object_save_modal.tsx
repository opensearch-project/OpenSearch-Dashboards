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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  htmlIdGenerator,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiCompressedFieldText,
  EuiForm,
  EuiCompressedFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiCompressedSwitch,
  EuiSwitchEvent,
  EuiCompressedTextArea,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { unstable_batchedUpdates } from 'react-dom';
import { SaveResult } from './show_saved_object_save_modal';

export interface OnSaveProps {
  newTitle: string;
  newCopyOnSave: boolean;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  newDescription: string;
}

interface Props {
  onSave: (props: OnSaveProps) => void | Promise<SaveResult | undefined>;
  onClose: () => void;
  title: string;
  showCopyOnSave: boolean;
  initialCopyOnSave?: boolean;
  objectType: string;
  confirmButtonLabel?: React.ReactNode;
  options?: React.ReactNode | ((state: SaveModalState) => React.ReactNode);
  description?: string;
  showDescription: boolean;
}

export interface SaveModalState {
  title: string;
  copyOnSave: boolean;
  isTitleDuplicateConfirmed: boolean;
  hasTitleDuplicate: boolean;
  isLoading: boolean;
  visualizationDescription: string;
}

export const SavedObjectSaveModal = (props: Props) => {
  const {
    onSave,
    onClose,
    showCopyOnSave,
    initialCopyOnSave,
    objectType,
    confirmButtonLabel,
    options,
    description,
    showDescription,
  } = props;
  const warning = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(props.title);
  const [copyOnSave, setCopyOnSave] = useState(!!initialCopyOnSave);
  const [isTitleDuplicateConfirmed, setIsTitleDuplicateConfirmed] = useState(false);
  const [hasTitleDuplicate, setHasTitleDuplicate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visualizationDescription, setVisualizationDescription] = useState(description || '');
  const duplicateWarningId = useMemo(() => htmlIdGenerator()(), []);

  const renderViewDescription = () => {
    if (!showDescription) {
      return;
    }

    return (
      <EuiCompressedFormRow
        fullWidth
        label={
          <FormattedMessage
            id="savedObjects.saveModal.descriptionLabel"
            defaultMessage="Description"
          />
        }
      >
        <EuiCompressedTextArea
          data-test-subj="viewDescription"
          value={visualizationDescription}
          onChange={onDescriptionChange}
        />
      </EuiCompressedFormRow>
    );
  };

  const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVisualizationDescription(event.target.value);
  };

  const onTitleDuplicate = () => {
    unstable_batchedUpdates(() => {
      setIsLoading(false);
      setIsTitleDuplicateConfirmed(true);
      setHasTitleDuplicate(true);
    });

    if (warning.current) {
      warning.current.focus();
    }
  };

  const saveSavedObject = useCallback(async () => {
    if (isLoading) {
      // ignore extra clicks
      return;
    }

    setIsLoading(true);

    await onSave({
      newTitle: title,
      newCopyOnSave: copyOnSave,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
      newDescription: visualizationDescription,
    });
  }, [copyOnSave, isLoading, isTitleDuplicateConfirmed, onSave, title, visualizationDescription]);

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    unstable_batchedUpdates(() => {
      setTitle(event.target.value);
      setIsTitleDuplicateConfirmed(false);
      setHasTitleDuplicate(false);
    });
  };

  const onCopyOnSaveChange = (event: EuiSwitchEvent) => {
    setCopyOnSave(event.target.checked);
  };

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSavedObject();
  };

  const renderConfirmButton = () => {
    const confirmLabel: string | React.ReactNode =
      confirmButtonLabel ??
      i18n.translate('savedObjects.saveModal.saveButtonLabel', {
        defaultMessage: 'Save',
      });

    return (
      <EuiSmallButton
        fill
        data-test-subj="confirmSaveSavedObjectButton"
        isLoading={isLoading}
        isDisabled={title.length === 0}
        type="submit"
        form="savedObjectSaveModalForm"
      >
        {confirmLabel}
      </EuiSmallButton>
    );
  };

  const renderDuplicateTitleCallout = () => {
    if (!hasTitleDuplicate) {
      return;
    }

    return (
      <>
        <div ref={warning} tabIndex={-1}>
          <EuiCallOut
            title={
              <FormattedMessage
                id="savedObjects.saveModal.duplicateTitleLabel"
                defaultMessage="This {objectType} already exists"
                values={{ objectType }}
              />
            }
            color="warning"
            data-test-subj="titleDupicateWarnMsg"
            id={duplicateWarningId}
          >
            <p>
              <FormattedMessage
                id="savedObjects.saveModal.duplicateTitleDescription"
                defaultMessage="Saving '{title}' creates a duplicate title."
                values={{
                  title,
                }}
              />
            </p>
          </EuiCallOut>
        </div>
        <EuiSpacer />
      </>
    );
  };

  const renderCopyOnSave = () => {
    if (!showCopyOnSave) {
      return;
    }

    return (
      <>
        <EuiCompressedSwitch
          data-test-subj="saveAsNewCheckbox"
          checked={copyOnSave}
          onChange={onCopyOnSaveChange}
          label={
            <FormattedMessage
              id="savedObjects.saveModal.saveAsNewLabel"
              defaultMessage="Save as new {objectType}"
              values={{ objectType }}
            />
          }
        />
        <EuiSpacer />
      </>
    );
  };

  return (
    <EuiModal
      data-test-subj="savedObjectSaveModal"
      className="osdSavedObjectSaveModal"
      onClose={onClose}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiText size="s">
            <h2>
              <FormattedMessage
                id="savedObjects.saveModal.saveTitle"
                defaultMessage="Save {objectType}"
                values={{ objectType }}
              />
            </h2>
          </EuiText>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {renderDuplicateTitleCallout()}

        <EuiForm component="form" onSubmit={onFormSubmit} id="savedObjectSaveModalForm">
          {!showDescription && description && (
            <EuiText size="s" color="subdued">
              {description}
            </EuiText>
          )}

          <EuiSpacer />

          {renderCopyOnSave()}

          <EuiCompressedFormRow
            fullWidth
            label={
              <FormattedMessage id="savedObjects.saveModal.titleLabel" defaultMessage="Title" />
            }
          >
            <EuiCompressedFieldText
              fullWidth
              autoFocus
              data-test-subj="savedObjectTitle"
              value={title}
              onChange={onTitleChange}
              isInvalid={(!isTitleDuplicateConfirmed && hasTitleDuplicate) || title.length === 0}
              aria-describedby={hasTitleDuplicate ? duplicateWarningId : undefined}
            />
          </EuiCompressedFormRow>

          {renderViewDescription()}

          {typeof options === 'function'
            ? options({
                title,
                copyOnSave,
                isTitleDuplicateConfirmed,
                hasTitleDuplicate,
                isLoading,
                visualizationDescription,
              })
            : options}
        </EuiForm>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty data-test-subj="saveCancelButton" onClick={onClose}>
          <FormattedMessage id="savedObjects.saveModal.cancelButtonLabel" defaultMessage="Cancel" />
        </EuiSmallButtonEmpty>

        {renderConfirmButton()}
      </EuiModalFooter>
    </EuiModal>
  );
};
