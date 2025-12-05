/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback, useMemo, useState } from 'react';
import { BaseDataset, DEFAULT_DATA, Dataset, Query } from '../../../../common';
import { getQueryService } from '../../../services';
import { IDataPluginServices } from '../../../types';
import { SchemaMappings } from './schema_mappings';
import { getSchemaConfigs } from './schema_config';
import { SaveAsDatasetOption } from './save_as_dataset_option';
import { DatasetMetadataFields } from './dataset_metadata_fields';
import { useDatasetFields } from './use_dataset_fields';

export const ConfiguratorV2 = ({
  services,
  baseDataset,
  onConfirm,
  onCancel,
  onPrevious,
  alwaysShowDatasetFields,
  signalType,
}: {
  services: IDataPluginServices;
  baseDataset: BaseDataset;
  onConfirm: (query: Partial<Query>, saveDataset?: boolean) => void;
  onCancel: () => void;
  onPrevious: () => void;
  alwaysShowDatasetFields?: boolean;
  signalType?: string;
}) => {
  // Services
  const queryService = getQueryService();
  const queryString = queryService.queryString;
  const languageService = queryString.getLanguageService();
  const datasetService = queryString.getDatasetService();
  const datasetType = datasetService.getType(baseDataset.type);

  // Derived values
  const supportedLanguages = datasetType?.supportedLanguages(baseDataset) || [];
  const languages = supportedLanguages.filter(
    (langId) =>
      !services.appName ||
      languageService.getLanguage(langId)?.supportedAppNames?.includes(services.appName)
  );
  const isAsyncType = datasetType?.meta.isFieldLoadAsync ?? false;
  const supportsTimeFilter = datasetType?.meta?.supportsTimeFilter ?? true;

  const [language, setLanguage] = useState<string>(() => {
    const currentLanguage = queryString.getQuery().language;
    if (languages.includes(currentLanguage)) {
      return currentLanguage;
    }
    return languages[0];
  });

  // State
  const [dataset, setDataset] = useState<Dataset>(baseDataset);
  const [timeFieldName, setTimeFieldName] = useState<string | undefined>(dataset.timeFieldName);
  const [saveAsDataset, setSaveAsDataset] = useState(false);
  const [schemaMappings, setSchemaMappings] = useState<Record<string, Record<string, string>>>(
    dataset.schemaMappings || {}
  );

  // Fetch fields using custom hook
  const { allFields, dateFields, loading: timeFieldsLoading } = useDatasetFields(
    baseDataset,
    datasetType,
    supportsTimeFilter
  );

  // Constants
  const noTimeFilter = i18n.translate(
    'data.explorer.datasetSelector.advancedSelector.configurator.timeField.noTimeFieldOptionLabel',
    {
      defaultMessage: "I don't want to use the time filter",
    }
  );

  // Memoized values
  const filteredSchemas = useMemo(() => {
    if (!signalType) return [];
    const schemaConfigs = getSchemaConfigs();
    return Object.entries(schemaConfigs).filter(([_, config]) => config.signalType === signalType);
  }, [signalType]);

  const submitDisabled = useMemo(() => {
    return (
      timeFieldsLoading ||
      (timeFieldName === undefined &&
        dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN &&
        dateFields.length > 0) ||
      (alwaysShowDatasetFields && isAsyncType)
    );
  }, [
    dataset.type,
    timeFieldName,
    dateFields,
    timeFieldsLoading,
    alwaysShowDatasetFields,
    isAsyncType,
  ]);

  const saveAsDatasetDisabled =
    isAsyncType || dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;

  // Handlers
  const handleDatasetChange = useCallback((updates: Partial<Dataset>) => {
    setDataset((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>
            <FormattedMessage
              id="data.explorer.datasetSelector.advancedSelector.configurator.title"
              defaultMessage="Step 2: Configure data"
            />
          </h1>
          <EuiText>
            <p>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.configurator.description"
                defaultMessage="Configure selected data based on parameters available."
              />
            </p>
          </EuiText>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiForm className="datasetConfigurator" data-test-subj="datasetConfigurator">
          <EuiFormRow
            label={i18n.translate(
              'data.explorer.datasetSelector.advancedSelector.configurator.datasetLabel',
              {
                defaultMessage: 'Data',
              }
            )}
          >
            <EuiFieldText disabled value={dataset.title} />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.translate(
              'data.explorer.datasetSelector.advancedSelector.configurator.languageLabel',
              {
                defaultMessage: 'Language',
              }
            )}
          >
            <EuiSelect
              options={languages.map((languageId) => ({
                text: languageService.getLanguage(languageId)?.title || languageId,
                value: languageId,
              }))}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                handleDatasetChange({ language: e.target.value });
              }}
              data-test-subj="advancedSelectorLanguageSelect"
            />
          </EuiFormRow>
          {supportsTimeFilter &&
            (dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ? (
              <EuiFormRow
                label={i18n.translate(
                  'data.explorer.datasetSelector.advancedSelector.configurator.indexPatternTimeFieldLabel',
                  {
                    defaultMessage: 'Time field',
                  }
                )}
              >
                <EuiFieldText disabled value={dataset.timeFieldName ?? 'No time field'} />
              </EuiFormRow>
            ) : (
              <EuiFormRow
                label={i18n.translate(
                  'data.explorer.datasetSelector.advancedSelector.configurator.timeFieldLabel',
                  {
                    defaultMessage: 'Time field',
                  }
                )}
              >
                <EuiSelect
                  options={[
                    ...dateFields.map((field) => ({
                      text: field.displayName || field.name,
                      value: field.name,
                    })),
                    { text: '-----', value: '-----', disabled: true },
                    { text: noTimeFilter, value: noTimeFilter },
                  ]}
                  value={timeFieldName}
                  onChange={(e) => {
                    const value = e.target.value === noTimeFilter ? undefined : e.target.value;
                    setTimeFieldName(e.target.value);
                    handleDatasetChange({ timeFieldName: value });
                  }}
                  hasNoInitialSelection
                  data-test-subj="advancedSelectorTimeFieldSelect"
                />
              </EuiFormRow>
            ))}
          {filteredSchemas.length > 0 && (
            <>
              <EuiSpacer size="m" />
              <SchemaMappings
                availableFields={allFields}
                schemaMappings={schemaMappings}
                onChange={setSchemaMappings}
                schemas={filteredSchemas}
              />
            </>
          )}
          <EuiSpacer size="m" />
          {!alwaysShowDatasetFields && (
            <SaveAsDatasetOption
              checked={saveAsDataset}
              onChange={setSaveAsDataset}
              disabled={saveAsDatasetDisabled}
            />
          )}
          {(alwaysShowDatasetFields || saveAsDataset) && (
            <DatasetMetadataFields
              displayName={dataset.displayName}
              description={dataset.description}
              onDisplayNameChange={(value) => handleDatasetChange({ displayName: value })}
              onDescriptionChange={(value) => handleDatasetChange({ description: value })}
              showAsyncWarning={alwaysShowDatasetFields && isAsyncType}
            />
          )}
        </EuiForm>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel} data-test-subj="advancedSelectorCancelButton">
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.cancel"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>
        <EuiButton onClick={onPrevious} iconType="arrowLeft" iconSide="left">
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.previous"
            defaultMessage="Back"
          />
        </EuiButton>
        <EuiButton
          onClick={async () => {
            const shouldSaveDataset = alwaysShowDatasetFields || saveAsDataset;
            const updatedDataset = { ...dataset, schemaMappings };
            await datasetService.cacheDataset(updatedDataset, services);
            onConfirm({ dataset: updatedDataset, language }, shouldSaveDataset || undefined);
          }}
          fill
          disabled={submitDisabled}
          data-test-subj="advancedSelectorConfirmButton"
        >
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.confirm"
            defaultMessage="Select Data"
          />
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};
