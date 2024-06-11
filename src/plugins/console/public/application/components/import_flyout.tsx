/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiCallOut,
  EuiSpacer,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { Fragment, useState } from 'react';
import { ImportMode, ImportModeControl } from './import_mode_control';
import { useServicesContext } from '../contexts';
import { TextObject } from '../../../common/text_object';
import { OverwriteModal } from './overwrite_modal';

const OVERWRITE_ALL_DEFAULT = false;

export interface ImportFlyoutProps {
  close: () => void;
  refresh: () => void;
}

const getErrorMessage = (e: any) => {
  const errorMessage =
    e.body?.error && e.body?.message ? `${e.body.error}: ${e.body.message}` : e.message;
  return i18n.translate('console.ImportFlyout.importFileErrorMessage', {
    defaultMessage: 'The file could not be processed due to error: "{error}"',
    values: {
      error: errorMessage,
    },
  });
};

export const ImportFlyout = ({ close, refresh }: ImportFlyoutProps) => {
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState('idle');
  const [loadingMessage, setLoadingMessage] = useState<string>();
  const [file, setFile] = useState<File>();
  const [jsonData, setJsonData] = useState<TextObject>();
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>({
    overwrite: OVERWRITE_ALL_DEFAULT,
  });

  const {
    services: {
      objectStorageClient,
      uiSettings,
      notifications: { toasts },
    },
  } = useServicesContext();

  const dateFormat = uiSettings.get<string>('dateFormat');

  const setImportFile = (files: FileList | null) => {
    const isFirstFileMissing = !files?.[0];
    if (isFirstFileMissing) {
      setFile(undefined);
      return;
    }
    const fileContent = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileData = event.target?.result;
      if (typeof fileData === 'string') {
        const parsedData = JSON.parse(fileData);
        setJsonData(parsedData);
      }
    };

    reader.readAsText(fileContent);
    setFile(fileContent);
    setStatus('idle');
  };

  const renderError = () => {
    if (status !== 'error') {
      return null;
    }

    return (
      <Fragment>
        <EuiCallOut
          title={
            <FormattedMessage
              id="console.importFlyout.errorCalloutTitle"
              defaultMessage="Sorry, there was an error"
            />
          }
          color="danger"
        >
          <p data-test-subj="importSenseObjectsErrorText">{error}</p>
        </EuiCallOut>
        <EuiSpacer size="s" />
      </Fragment>
    );
  };

  const renderBody = () => {
    if (status === 'loading') {
      return (
        <EuiFlexGroup justifyContent="spaceAround">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
            <EuiSpacer size="m" />
            <EuiText>
              <p>{loadingMessage}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    return (
      <EuiForm>
        <EuiFormRow
          fullWidth
          label={
            <FormattedMessage
              id="console.ImportFlyout.selectFileToImportFormRowLabel"
              defaultMessage="Select a file to import"
            />
          }
        >
          <EuiFilePicker
            accept=".ndjson, .json"
            name="queryFileImport"
            fullWidth
            initialPromptText={
              <FormattedMessage
                id="console.ImportFlyout.importPromptText"
                defaultMessage="Import"
              />
            }
            onChange={setImportFile}
            data-test-subj="queryFilePicker"
          />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <ImportModeControl
            initialValues={importMode}
            updateSelection={(newValues: ImportMode) => setImportMode(newValues)}
          />
        </EuiFormRow>
      </EuiForm>
    );
  };

  const importFile = async (isOverwriteConfirmed?: boolean) => {
    setStatus('loading');
    setError(undefined);
    try {
      const results = await objectStorageClient.text.findAll();
      const currentText = results.sort((a, b) => a.createdAt - b.createdAt)[0];

      if (jsonData?.text) {
        if (importMode.overwrite) {
          if (!isOverwriteConfirmed) {
            setShowOverwriteModal(true);
            return;
          } else {
            setLoadingMessage('Importing queries and overwriting existing ones...');
            const newObject = {
              createdAt: Date.now(),
              updatedAt: Date.now(),
              text: jsonData.text,
            };
            if (results.length) {
              await objectStorageClient.text.update({
                ...currentText,
                ...newObject,
              });
            } else {
              await objectStorageClient.text.create({
                ...newObject,
              });
            }
          }
          toasts.addSuccess('Queries overwritten.');
        } else {
          setLoadingMessage('Importing queries and merging with existing ones...');
          if (results.length) {
            await objectStorageClient.text.update({
              ...currentText,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              text: currentText.text.concat(
                `\n\n#Imported on ${moment(Date.now()).format(dateFormat)}\n\n${jsonData.text}`
              ),
            });
            toasts.addSuccess('Queries merged.');
          }
        }
        refresh();
        setLoadingMessage(undefined);
        setStatus('idle');
        close();
      } else {
        setStatus('error');
        setError(
          i18n.translate('console.ImportFlyout.importFileErrorMessage', {
            defaultMessage: 'The selected file is not valid. Please select a valid JSON file.',
          })
        );
        return;
      }
    } catch (e) {
      setStatus('error');
      setError(getErrorMessage(e));
    }
  };

  const onConfirm = () => {
    setShowOverwriteModal(false);
    importFile(true);
  };

  const onSkip = () => {
    setShowOverwriteModal(false);
    setStatus('idle');
  };

  const renderFooter = () => {
    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            onClick={close}
            size="s"
            disabled={status === 'loading' || status === 'success'}
            data-test-subj="importQueriesCancelBtn"
          >
            <FormattedMessage
              id="console.importFlyout.import.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            disabled={!file}
            onClick={() => importFile(false)}
            size="s"
            fill
            isLoading={status === 'loading'}
            data-test-subj="importQueriesConfirmBtn"
          >
            <FormattedMessage
              id="console.importFlyout.import.confirmButtonLabel"
              defaultMessage="Import"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  return (
    <EuiFlyout onClose={close} size="s">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>
            <FormattedMessage
              id="console.ImportFlyout.importQueriesTitle"
              defaultMessage="Import queries"
            />
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {renderError()}
        {renderBody()}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>{renderFooter()}</EuiFlyoutFooter>
      {showOverwriteModal && <OverwriteModal onSkip={onSkip} onConfirm={onConfirm} />}
    </EuiFlyout>
  );
};
