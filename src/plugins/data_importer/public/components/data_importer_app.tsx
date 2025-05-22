/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  EuiSpacer,
  EuiComboBox,
  EuiFormRow,
} from '@elastic/eui';
import { extname } from 'path';
import {
  DataSourceManagementPluginSetup,
  DataSourceOption,
  DataSourceSelectableConfig,
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

interface DataImporterPluginAppProps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  savedObjects: CoreStart['savedObjects'];
  navigation: NavigationPublicPluginStart;
  config: PublicConfigSchema;
  hideLocalCluster: boolean;
  dataSourceEnabled: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

const ROWS_COUNT = 10;

export const DataImporterPluginApp = ({
  basename,
  notifications,
  http,
  navigation,
  config,
  savedObjects,
  dataSourceEnabled,
  hideLocalCluster,
  dataSourceManagement,
}: DataImporterPluginAppProps) => {
  const DataSourceMenuComponent = dataSourceManagement?.ui.getDataSourceMenu<
    DataSourceSelectableConfig
  >();
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
  const [showDelimiterChoice, setShowDelimiterChoice] = useState<boolean>(false);
  const [delimiter, setDelimiter] = useState<string | undefined>(
    dataType === CSV_FILE_TYPE ? CSV_SUPPORTED_DELIMITERS[0] : undefined
  );
  const [visibleRows, setVisibleRows] = useState<number>(ROWS_COUNT);
  const [indexOptions, setIndexOptions] = useState<Array<{ label: string }>>([]);
  const [createMode, setCreateMode] = useState<boolean>(false);

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
    }

    if (response && response.success) {
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
      const failedRows = `${response.message.failedRows.join(', ')}`;
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportSomeFailed', {
          defaultMessage: `Some rows failed to ingest: {failedRows}`,
          values: { failedRows },
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
  }, [http, dataSourceId, notifications.toasts, filePreviewData, hideLocalCluster]);

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
    return (
      <div>
        {DataSourceMenuComponent && (
          <>
            <DataSourceMenuComponent
              componentType={'DataSourceSelectable'}
              componentConfig={{
                fullWidth: true,
                savedObjects: savedObjects.client,
                notifications,
                onSelectedDataSources: onDataSourceSelect,
                onManageDataSource: () => {},
              }}
              onManageDataSource={() => {}}
            />
            <EuiSpacer size="m" />
          </>
        )}
      </div>
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
              <EuiPageContent>
                <EuiFlexGroup>
                  <EuiFlexItem grow={1}>
                    <ImportTypeSelector
                      updateSelection={onImportTypeChange}
                      initialSelection={importType}
                    />
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
                          defaultMessage: 'Create/Select Index Name',
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
                    {showDelimiterChoice && (
                      <DelimiterSelect
                        onDelimiterChange={onDelimiterChange}
                        initialDelimiter={delimiter}
                      />
                    )}
                    {importType === IMPORT_CHOICE_FILE && (
                      <ImportFileContentBody
                        enabledFileTypes={config.enabledFileTypes}
                        onFileUpdate={onFileInput}
                      />
                    )}
                    {importType === IMPORT_CHOICE_FILE && (
                      <EuiButton fullWidth={true} isDisabled={disableImport} onClick={previewData}>
                        Preview
                      </EuiButton>
                    )}
                    <EuiSpacer size="s" />
                    <EuiButton fullWidth={true} isDisabled={disableImport} onClick={importData}>
                      Import
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={2}>
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
                      <div>
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
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
