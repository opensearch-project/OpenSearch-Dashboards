/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  EuiButton,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageHeader,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiLoadingSpinner,
  EuiProgress,
  EuiSpacer,
  EuiComboBox,
  EuiFormRow,
  EuiFieldText,
  EuiConfirmModal,
} from '@elastic/eui';
import { extname } from 'path';
import {
  DataSourceManagementPluginSetup,
  DataSourceOption,
} from '../../../data_source_management/public';
import { CoreStart } from '../../../../core/public';
import { NavigationPublicPluginStart } from '../../../navigation/public';
import { PLUGIN_ID } from '../../common';
import {
  ImportChoices,
  ImportTypeSelector,
  IMPORT_CHOICE_FILE,
  IMPORT_CHOICE_TEXT,
} from './import_type_selector';
import { importFile } from '../lib/import_file';
import { importText } from '../lib/import_text';
import { ImportResponse, PreviewResponse } from '../types';
import { PublicConfigSchema } from '../../config';
import { ImportTextContentBody } from './import_text_content';
import { ImportFileContentBody } from './import_file_content';
import { CSV_FILE_TYPE, CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { DelimiterSelect } from './delimiter_select';
import { previewFile } from '../lib/preview_file';
import { PreviewComponent } from './preview_table';
import { catIndices } from '../lib/cat_indices';

export interface DataImporterPluginAppProps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  savedObjects: CoreStart['savedObjects'];
  navigation: NavigationPublicPluginStart;
  config: PublicConfigSchema;
  hideLocalCluster: boolean;
  dataSourceEnabled: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  embedded?: boolean; // When true, skip Router, nav, and page wrappers
  /**
   * Called when the host (modal/flyout) should actually close. Hosts must route every
   * close affordance (X, Escape, Done) through {@link DataImporterHandle.requestClose}
   * so un-imported input is guarded by a discard confirmation.
   */
  onClose?: () => void;
}

/** Imperative handle exposed to hosts that embed the importer in a closable container. */
export interface DataImporterHandle {
  /** Closes via `onClose`, or asks for confirmation first if there is un-imported input. */
  requestClose: () => void;
}

const ROWS_COUNT = 10;

const DataImporterPluginAppComponent = (
  {
    basename,
    notifications,
    http,
    navigation,
    config,
    savedObjects,
    dataSourceEnabled,
    hideLocalCluster,
    dataSourceManagement,
    embedded = false,
    onClose,
  }: DataImporterPluginAppProps,
  ref: React.ForwardedRef<DataImporterHandle>
) => {
  const [indexName, setIndexName] = useState<string>();
  const [importType, setImportType] = useState<ImportChoices>(IMPORT_CHOICE_FILE);
  const [disableImport, setDisableImport] = useState<boolean>();
  const [dataType, setDataType] = useState<string | undefined>(
    config.enabledFileTypes.length > 0 ? config.enabledFileTypes[0] : undefined
  );
  const [filePreviewData, setFilePreviewData] = useState<PreviewResponse>({
    documents: [],
    predictedMapping: {},
  });
  const [inputText, setText] = useState<string | undefined>();
  const [inputFile, setInputFile] = useState<File | undefined>();
  const [dataSourceId, setDataSourceId] = useState<string | undefined>();
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [showDelimiterChoice, setShowDelimiterChoice] = useState<boolean>(false);
  const [delimiter, setDelimiter] = useState<string | undefined>(
    dataType === CSV_FILE_TYPE ? CSV_SUPPORTED_DELIMITERS[0] : undefined
  );
  const [visibleRows, setVisibleRows] = useState<number>(ROWS_COUNT);
  const [indexOptions, setIndexOptions] = useState<Array<{ label: string }>>([]);
  const [createMode, setCreateMode] = useState<boolean>(false);
  const [importIdentifier, setImportIdentifier] = useState<string>('');
  // The exact input object (File, or text snapshot) that was last imported successfully.
  // Dirty is derived by identity against the current input rather than toggled by hand, so
  // attaching a new file (always a new File object) re-arms the guard automatically, and an
  // in-flight import can only clear the input it actually submitted.
  const [lastImportedInput, setLastImportedInput] = useState<File | string | undefined>();
  const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] = useState<boolean>(false);

  const currentInput = importType === IMPORT_CHOICE_FILE ? inputFile : inputText;
  const isDirty = !!currentInput && currentInput !== lastImportedInput;

  const requestClose = useCallback(() => {
    if (isDirty) {
      setIsDiscardConfirmVisible(true);
    } else {
      onClose?.();
    }
  }, [isDirty, onClose]);

  useImperativeHandle(ref, () => ({ requestClose }), [requestClose]);

  const onDiscardCancel = () => setIsDiscardConfirmVisible(false);

  const onDiscardConfirm = () => {
    setIsDiscardConfirmVisible(false);
    onClose?.();
  };

  const onImportTypeChange = (type: ImportChoices) => {
    if (type === IMPORT_CHOICE_FILE) {
      setInputFile(undefined);
    } else if (type === IMPORT_CHOICE_TEXT) {
      setText(undefined);
    }
    setImportType(type);
  };

  const onDataTypeChange = (type: string) => {
    if (type !== CSV_FILE_TYPE) {
      setDelimiter(undefined);
    }
    setDataType(type);
  };

  const onFileInput = (file?: File) => {
    setInputFile(file);
    if (!file) {
      setFilePreviewData({
        documents: [],
        predictedMapping: {},
      });
    }
  };

  const onTextInput = (text: string) => {
    setText(text);
  };

  const onDelimiterChange = (e: any) => {
    setDelimiter(e.target.value);
  };

  const onDataSourceSelect = (newDataSource: DataSourceOption[]) => {
    if (newDataSource.length > 0) {
      setDataSourceId(newDataSource[0].id);
    }
  };

  const onIndexNameChange = (selected: Array<{ label: string }>) => {
    if (selected.length) {
      setIndexName(selected[0].label);
      setCreateMode(false);
    } else {
      setIndexName('');
    }
  };

  const onCreateIndexName = (createdOption: string) => {
    setIndexName(createdOption);
    setCreateMode(true);
  };

  const previewData = async () => {
    if (importType === IMPORT_CHOICE_FILE) {
      if (inputFile) {
        const fileExtension = extname(inputFile.name);
        setIsLoadingPreview(true);
        try {
          const response = await previewFile({
            http,
            file: inputFile,
            createMode,
            fileExtension,
            indexName: indexName!,
            previewCount: config.filePreviewDocumentsCount,
            delimiter,
            selectedDataSourceId: dataSourceId,
          });
          setIsLoadingPreview(false);
          if (response) {
            setFilePreviewData(response);
            notifications.toasts.addSuccess(
              i18n.translate('dataImporter.previewSuccess', {
                defaultMessage: `Preview successful`,
              })
            );
          } else {
            notifications.toasts.addDanger(
              i18n.translate('dataImporter.previewFailed', {
                defaultMessage: `Preview failed`,
              })
            );
          }
        } catch (error) {
          setIsLoadingPreview(false);
          const errorMessage = error.body?.message ?? error;
          notifications.toasts.addDanger(
            i18n.translate('dataImporter.previewError', {
              defaultMessage: `Preview failed: {errorMessage}`,
              values: { errorMessage },
            })
          );
        }
      }
    }
  };

  const updateIndexSelector = async () => {
    if (createMode) {
      try {
        const catIndicesResponse = await catIndices({ http, dataSourceId });
        setIndexOptions(catIndicesResponse.indices.map((index: string) => ({ label: index })));
        setCreateMode(false);
      } catch (error) {
        const errorMessage = error.body?.message ?? error;
        notifications.toasts.addDanger(
          i18n.translate('dataImporter.indicesFetchError', {
            defaultMessage: `Failed to fetch indices: {errorMessage}`,
            values: { errorMessage },
          })
        );
      }
    }
  };

  const importData = async () => {
    let response: ImportResponse | undefined;
    // Capture what is being submitted; the user may attach another file while this is in flight.
    const submittedInput = currentInput;

    setIsImporting(true);
    try {
      if (importType === IMPORT_CHOICE_FILE) {
        response = await importFile({
          http,
          file: inputFile!,
          indexName: indexName!,
          createMode,
          // TODO This should be determined from the file type selectable
          fileExtension: extname(inputFile!.name),
          delimiter,
          selectedDataSourceId: dataSourceId,
          mapping: filePreviewData.predictedMapping,
          importIdentifier,
        });
      } else if (importType === IMPORT_CHOICE_TEXT) {
        response = await importText({
          http,
          text: inputText!,
          textFormat: dataType!,
          createMode,
          indexName: indexName!,
          delimiter,
          selectedDataSourceId: dataSourceId,
          mapping: filePreviewData.predictedMapping,
          importIdentifier,
        });
      }
    } catch (error) {
      const errorMessage = error.body?.message ?? error;
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportError', {
          defaultMessage: `Data import failed: {errorMessage}`,
          values: { errorMessage },
        })
      );
      return;
    } finally {
      setIsImporting(false);
    }

    // Rows may have landed while the lookup's alias could not be created: the lookup is then
    // unreachable, so this is a failure the user must see (and act on), never a silent success.
    if (response?.aliasError) {
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.aliasCreationFailed', {
          defaultMessage: `Data was indexed into {indexName}, but the lookup could not be created: {aliasError}`,
          values: { indexName, aliasError: response.aliasError },
        })
      );
    }

    if (response && response.success && response.aliasError) {
      // Leave dirty set (not a clean import) but still refresh the index list.
      await updateIndexSelector();
    } else if (response && response.success) {
      // Only a fully successful import clears dirty. The flyout deliberately stays open so the
      // user can attach and import another file (multi-file flow); closing is a separate action.
      setLastImportedInput(submittedInput);
      notifications.toasts.addSuccess(
        i18n.translate('dataImporter.dataImported', {
          defaultMessage: `{total} documents successfully ingested into {indexName}`,
          values: {
            total: response.message.total,
            indexName,
          },
        })
      );

      await updateIndexSelector();
    } else if (response && response.message.failedRows.length > 0) {
      const { errorSummary, failedRows: failed, total } = response.message;
      let detail: string;
      if (errorSummary && errorSummary.length > 0) {
        // Prefer the bucketed causes: one line per distinct failure reason with a count and a few
        // example rows, rather than dumping every failed row number.
        detail = errorSummary
          .map(
            ({ reason, count, sampleRows }) =>
              `${reason} (${count} row${count === 1 ? '' : 's'}; e.g. ${sampleRows.join(', ')})`
          )
          .join('; ');
      } else {
        detail = failed.join(', ');
      }
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportSomeFailed', {
          defaultMessage: `{failed} of {total} rows failed to ingest: {detail}`,
          values: { failed: failed.length, total, detail },
        })
      );

      await updateIndexSelector();
    } else {
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportFailed', {
          defaultMessage: `Data import failed`,
        })
      );
    }
  };

  useEffect(() => {
    async function fetchIndices() {
      try {
        const response = await catIndices({ http, dataSourceId });
        setIndexOptions(response.indices.map((index: string) => ({ label: index })));
      } catch (error) {
        const errorMessage = error.body?.message ?? error;
        notifications.toasts.addDanger(
          i18n.translate('dataImporter.indicesFetchError', {
            defaultMessage: `Failed to fetch indices: {errorMessage}`,
            values: { errorMessage },
          })
        );
      }
    }

    if (!hideLocalCluster || dataSourceId) {
      fetchIndices();
    }
  }, [http, dataSourceId, notifications.toasts, hideLocalCluster]);

  useEffect(() => {
    setDisableImport(shouldDisableImportButton());
    setShowDelimiterChoice(shouldShowDelimiter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importType, inputText, inputFile, dataType, indexName]);

  useEffect(() => {
    if (inputText && inputText.length > config.maxTextCount) {
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.textTooLong', {
          defaultMessage: `Text exceeds {maxTextCount} characters`,
          values: { maxTextCount: config.maxTextCount },
        })
      );
    }

    if (inputFile && inputFile.size > config.maxFileSizeBytes) {
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.fileTooLarge', {
          defaultMessage: `File is too large`,
        })
      );
    }
  }, [inputText, inputFile, config.maxTextCount, config.maxFileSizeBytes, notifications.toasts]);

  const renderDataSourceComponent = useMemo(() => {
    if (!dataSourceEnabled || !dataSourceManagement) return null;

    const DataSourceSelector = dataSourceManagement!.ui
      .DataSourceSelector as React.ComponentType<any>;
    return (
      <DataSourceSelector
        savedObjectsClient={savedObjects.client}
        notifications={notifications.toasts}
        onSelectedDataSource={onDataSourceSelect}
        disabled={!dataSourceEnabled}
        fullWidth={true}
        compressed={false}
        hideLocalCluster={hideLocalCluster}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSourceManagement, savedObjects.client, notifications]);

  function shouldDisableImportButton() {
    const validFileType =
      importType === IMPORT_CHOICE_FILE && inputFile && inputFile.size < config.maxFileSizeBytes;
    const validTextType =
      importType === IMPORT_CHOICE_TEXT &&
      inputText &&
      inputText.length < config.maxTextCount &&
      dataType;
    return !(validFileType || validTextType) || !indexName;
  }

  function shouldShowDelimiter() {
    return (
      (inputFile &&
        importType === IMPORT_CHOICE_FILE &&
        extname(inputFile.name) === `.${CSV_FILE_TYPE}`) ||
      (importType === IMPORT_CHOICE_TEXT && dataType === CSV_FILE_TYPE)
    );
  }

  const loadMoreRows = () => {
    setVisibleRows((prevVisibleRows) => prevVisibleRows + ROWS_COUNT);
  };

  // Core importer content
  const importerContent = (
    <>
      {isImporting && (
        <EuiProgress
          size="xs"
          color="primary"
          position="absolute"
          data-test-subj="dataImporterImportProgress"
        />
      )}
      <EuiFlexGroup className={embedded ? 'dataImporterEmbedded__flexGroup' : undefined}>
        <EuiFlexItem grow={1} className={embedded ? 'dataImporterEmbedded__leftPanel' : undefined}>
          <ImportTypeSelector updateSelection={onImportTypeChange} initialSelection={importType} />
          <EuiSpacer size="s" />
          {dataSourceEnabled && (
            <>
              <EuiTitle size="xs">
                <span>
                  {i18n.translate('dataImporter.dataSource', {
                    defaultMessage: 'Select target data source',
                  })}
                </span>
              </EuiTitle>
              {renderDataSourceComponent}
            </>
          )}
          <EuiSpacer size="s" />
          <EuiTitle size="xs">
            <span>
              {i18n.translate('dataImporter.indexName', {
                defaultMessage: 'Select an existing index or create new',
              })}
            </span>
          </EuiTitle>
          <EuiFormRow>
            <EuiComboBox
              placeholder="Enter index name"
              singleSelection={{ asPlainText: true }}
              options={indexOptions}
              selectedOptions={indexName ? [{ label: indexName }] : []}
              onChange={onIndexNameChange}
              onCreateOption={onCreateIndexName}
            />
          </EuiFormRow>

          <EuiSpacer size="s" />
          <EuiTitle size="xs">
            <span>
              {i18n.translate('dataImporter.importIdentifier', {
                defaultMessage: 'Upload alias (optional)',
              })}
            </span>
          </EuiTitle>
          <EuiFormRow
            helpText={i18n.translate('dataImporter.importIdentifierHelp', {
              defaultMessage:
                'Create a filtered alias for this dataset to easily reference it later.',
            })}
          >
            <EuiFieldText
              placeholder="Alias name"
              value={importIdentifier}
              onChange={(e) => setImportIdentifier(e.target.value)}
              data-test-subj="importIdentifierInput"
            />
          </EuiFormRow>

          {showDelimiterChoice && (
            <>
              <EuiSpacer size="s" />
              <DelimiterSelect onDelimiterChange={onDelimiterChange} initialDelimiter={delimiter} />
            </>
          )}

          {importType === IMPORT_CHOICE_FILE && (
            <>
              <EuiSpacer size="s" />
              <ImportFileContentBody
                enabledFileTypes={config.enabledFileTypes}
                onFileUpdate={onFileInput}
                maxFileSizeBytes={config.maxFileSizeBytes}
              />
            </>
          )}
          {importType === IMPORT_CHOICE_FILE && (
            <>
              <EuiSpacer size="s" />
              <EuiButton
                fullWidth={true}
                isDisabled={disableImport || isImporting}
                onClick={previewData}
                data-test-subj="dataImporterPreviewButton"
              >
                {i18n.translate('dataImporter.previewButton', {
                  defaultMessage: 'Preview',
                })}
              </EuiButton>
            </>
          )}
          <EuiSpacer size="s" />
          <EuiButton
            fill
            fullWidth={true}
            isDisabled={disableImport || isImporting}
            isLoading={isImporting}
            onClick={importData}
            data-test-subj="dataImporterImportButton"
          >
            {isImporting
              ? i18n.translate('dataImporter.importingButton', {
                  defaultMessage: 'Importing…',
                })
              : i18n.translate('dataImporter.importButton', {
                  defaultMessage: 'Import',
                })}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={2} className={embedded ? 'dataImporterEmbedded__rightPanel' : undefined}>
          {importType === IMPORT_CHOICE_TEXT && (
            <ImportTextContentBody
              onTextChange={onTextInput}
              enabledFileTypes={config.enabledFileTypes}
              initialFileType={dataType!}
              characterLimit={config.maxTextCount}
              onFileTypeChange={onDataTypeChange}
            />
          )}
          {importType === IMPORT_CHOICE_FILE && (
            <div className={embedded ? 'dataImporterEmbedded__previewContainer' : undefined}>
              {isLoadingPreview ? (
                <EuiLoadingSpinner size="xl" />
              ) : (
                <PreviewComponent
                  previewData={filePreviewData.documents || []}
                  visibleRows={visibleRows}
                  loadMoreRows={loadMoreRows}
                  predictedMapping={filePreviewData.predictedMapping || {}}
                  existingMapping={filePreviewData.existingMapping || {}}
                />
              )}
            </div>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );

  const discardConfirmModal = isDiscardConfirmVisible && (
    <EuiConfirmModal
      title={
        importType === IMPORT_CHOICE_FILE
          ? i18n.translate('dataImporter.discardConfirm.fileTitle', {
              defaultMessage: "You haven't imported this file. Discard?",
            })
          : i18n.translate('dataImporter.discardConfirm.textTitle', {
              defaultMessage: "You haven't imported this data. Discard?",
            })
      }
      onCancel={onDiscardCancel}
      onConfirm={onDiscardConfirm}
      cancelButtonText={i18n.translate('dataImporter.discardConfirm.cancel', {
        defaultMessage: 'Cancel',
      })}
      confirmButtonText={i18n.translate('dataImporter.discardConfirm.confirm', {
        defaultMessage: 'Discard',
      })}
      buttonColor="danger"
      defaultFocusedButton="cancel"
      data-test-subj="dataImporterDiscardConfirmModal"
    />
  );

  // Return embedded or full app version
  if (embedded) {
    return (
      <I18nProvider>
        <>
          {importerContent}
          {discardConfirmModal}
        </>
      </I18nProvider>
    );
  }

  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu appName={PLUGIN_ID} useDefaultBehaviors={true} />
          <EuiPage>
            <EuiPageBody component="main">
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage id="dataImporter.mainTitle" defaultMessage="Data Importer" />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent className="data_importer_content" paddingSize="s">
                {importerContent}
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};

export const DataImporterPluginApp = forwardRef(DataImporterPluginAppComponent);
DataImporterPluginApp.displayName = 'DataImporterPluginApp';
