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
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiPageSideBar,
  EuiFieldText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiBasicTable,
  EuiLoadingSpinner,
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
import { ImportResponse } from '../types';
import { PublicConfigSchema } from '../../config';
import { ImportTextContentBody } from './import_text_content';
import { ImportFileContentBody } from './import_file_content';
import {
  CSV_FILE_TYPE,
  CSV_SUPPORTED_DELIMITERS,
  PLUGIN_NAME_AS_TITLE,
} from '../../common/constants';
import { DelimiterSelect } from './delimiter_select';
import { previewFile } from '../lib/preview';

interface DataImporterPluginAppProps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  savedObjects: CoreStart['savedObjects'];
  navigation: NavigationPublicPluginStart;
  config: PublicConfigSchema;
  dataSourceEnabled: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export const DataImporterPluginApp = ({
  basename,
  notifications,
  http,
  navigation,
  config,
  savedObjects,
  dataSourceEnabled,
  dataSourceManagement,
}: DataImporterPluginAppProps) => {
  const DataSourceMenuComponent =
    dataSourceManagement?.ui.getDataSourceMenu<DataSourceSelectableConfig>() || (() => null);
  const [indexName, setIndexName] = useState<string>();
  const [importType, setImportType] = useState<ImportChoices>(IMPORT_CHOICE_FILE);
  const [disableImport, setDisableImport] = useState<boolean>();
  const [dataType, setDataType] = useState<string | undefined>(
    config.enabledFileTypes.length > 0 ? config.enabledFileTypes[0] : undefined
  );
  const [inputText, setText] = useState<string | undefined>();
  const [inputFile, setInputFile] = useState<File | undefined>();
  const [dataSourceId, setDataSourceId] = useState<string | undefined>();
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceOption | undefined>();
  const [showDelimiterChoice, setShowDelimiterChoice] = useState<boolean>(shouldShowDelimiter());
  const [delimiter, setDelimiter] = useState<string | undefined>(
    dataType === CSV_FILE_TYPE ? CSV_SUPPORTED_DELIMITERS[0] : undefined
  );
  const [filePreviewData, setFilePreviewData] = useState<any[]>([]);
  const [filePreviewColumns, setFilePreviewColumns] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const onImportTypeChange = (type: ImportChoices) => {
    if (type === IMPORT_CHOICE_FILE) {
      setInputFile(undefined);
    } else if (type === IMPORT_CHOICE_TEXT) {
      setText(undefined);
    }
    setImportType(type);
  };

  const onIndexNameChange = (e: any) => {
    setIndexName(e.target.value);
  };

  const onDataTypeChange = (type: string) => {
    if (type !== CSV_FILE_TYPE) {
      setDelimiter(undefined);
    }
    setDataType(type);
  };

  const onFileInput = (file?: File) => {
    setInputFile(file);
    if (file) {
      setIsLoadingPreview(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').map((row) => row.split(','));
        const columns = rows[0].map((header, index) => ({
          field: `column_${index}`,
          name: header,
        }));
        const data = rows.slice(1, 11).map((row) =>
          row.reduce((acc: { [key: string]: string }, value, index) => {
            acc[`column_${index}`] = value;
            return acc;
          }, {})
        );
        setFilePreviewColumns(columns);
        setFilePreviewData(data);
        setIsLoadingPreview(false);
      };
      reader.readAsText(file);
    } else {
      setFilePreviewColumns([]);
      setFilePreviewData([]);
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
      setSelectedDataSource(newDataSource[0]);
    }
  };

  const previewData = async () => {
    if (importType === IMPORT_CHOICE_FILE) {
      if (inputFile) {
        const fileExtension = extname(inputFile.name);
        const response = await previewFile(
          http,
          inputFile,
          // TODO This should be determined from the index name textbox/selectable
          false,
          // TODO This should be determined from the file type selectable
          fileExtension,
          indexName!,
          delimiter,
          dataSourceId
        );
        if (response) {
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
      }
    }
  };

  const importData = async () => {
    let response: ImportResponse | undefined;

    try {
      if (importType === IMPORT_CHOICE_FILE) {
        response = await importFile(
          http,
          inputFile!,
          indexName!,
          // TODO This should be determined from the index name textbox/selectable
          false,
          // TODO This should be determined from the file type selectable
          extname(inputFile!.name),
          delimiter,
          dataSourceId
        );
      } else if (importType === IMPORT_CHOICE_TEXT) {
        response = await importText(
          http,
          inputText!,
          dataType!,
          indexName!,
          delimiter,
          dataSourceId
        );
      }
    } catch (error) {
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportError', {
          defaultMessage: `Data import failed: {error}`,
          values: { error },
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
    } else {
      const errorMessage = response ? `: ${response.message.message}` : '';
      notifications.toasts.addDanger(
        i18n.translate('dataImporter.dataImportFailed', {
          defaultMessage: `Data import failed {errorMessage}`,
          values: { errorMessage },
        })
      );
    }
  };

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
                onManageDataSource: () => {}, // Add a proper handler if needed
              }}
              onManageDataSource={function (): void {
                throw new Error('Function not implemented.');
              }}
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
    let inputFileType;
    if (inputFile) {
      const fileExtention = extname(inputFile.name).toLowerCase();
      inputFileType = fileExtention.startsWith('.') ? fileExtention.slice(1) : fileExtention;
    }
    return (
      (importType === IMPORT_CHOICE_FILE && inputFile && inputFileType === CSV_FILE_TYPE) ||
      (importType === IMPORT_CHOICE_TEXT && dataType === CSV_FILE_TYPE)
    );
  }

  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu appName={PLUGIN_ID} useDefaultBehaviors={true} />
          <EuiPage>
            <EuiPageSideBar>
              <ImportTypeSelector
                updateSelection={onImportTypeChange}
                initialSelection={importType}
              />
              {showDelimiterChoice && (
                <DelimiterSelect
                  onDelimiterChange={onDelimiterChange}
                  initialDelimiter={delimiter}
                />
              )}
              <EuiTitle size="xs">
                <span>
                  {i18n.translate('dataImporter.dataSource', {
                    defaultMessage: 'Data Source Options',
                  })}
                </span>
              </EuiTitle>
              <EuiFieldText placeholder="Index name" onChange={onIndexNameChange} />
              <EuiSpacer size="m" />
              {dataSourceEnabled && renderDataSourceComponent}
              <EuiButton fullWidth={true} isDisabled={disableImport} onClick={importData}>
                Import
              </EuiButton>
              <EuiSpacer size="m" />
              <EuiButton fullWidth={true} isDisabled={disableImport} onClick={previewData}>
                Preview
              </EuiButton>
            </EuiPageSideBar>
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
                    <EuiPageContentHeader>
                      <EuiTitle>
                        <h2>
                          <FormattedMessage
                            id="dataImporter.importFormTitle"
                            defaultMessage="Import Data"
                          />
                        </h2>
                      </EuiTitle>
                    </EuiPageContentHeader>
                    <ImportTypeSelector
                      updateSelection={onImportTypeChange}
                      initialSelection={importType}
                    />
                    {showDelimiterChoice && (
                      <DelimiterSelect
                        onDelimiterChange={onDelimiterChange}
                        initialDelimiter={delimiter}
                      />
                    )}
                    <EuiTitle size="xs">
                      <span>
                        {i18n.translate('dataImporter.dataSource', {
                          defaultMessage: 'Data Source Options',
                        })}
                      </span>
                    </EuiTitle>
                    <EuiFieldText placeholder="Index name" onChange={onIndexNameChange} />
                    <EuiSpacer size="m" />
                    {dataSourceEnabled && renderDataSourceComponent}
                    <ImportFileContentBody
                      enabledFileTypes={config.enabledFileTypes}
                      onFileUpdate={onFileInput}
                    />
                    <EuiButton fullWidth={true} isDisabled={disableImport} onClick={importData}>
                      Import
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={2}>
                    <EuiPageContentHeader>
                      <EuiTitle>
                        <h2>
                          {importType === IMPORT_CHOICE_TEXT && (
                            <FormattedMessage
                              id="dataImporter.textTitle"
                              defaultMessage="Paste Text Data"
                            />
                          )}
                          {importType === IMPORT_CHOICE_FILE && (
                            <FormattedMessage
                              id="dataImporter.fileTitle"
                              defaultMessage="Preview Data"
                            />
                          )}
                        </h2>
                      </EuiTitle>
                    </EuiPageContentHeader>
                    {importType === IMPORT_CHOICE_TEXT && (
                      <ImportTextContentBody
                        onTextChange={onTextInput}
                        enabledFileTypes={config.enabledFileTypes}
                        initialFileType={dataType!}
                        characterLimit={config.maxTextCount}
                        onFileTypeChange={onDataTypeChange}
                      />
                    )}
                    {importType === IMPORT_CHOICE_FILE && inputFile && (
                      <div>
                        {isLoadingPreview ? (
                          <EuiLoadingSpinner size="xl" />
                        ) : (
                          <EuiBasicTable items={filePreviewData} columns={filePreviewColumns} />
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
