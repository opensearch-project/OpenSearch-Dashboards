/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
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
  EuiTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseDataset, DEFAULT_DATA, Dataset, DatasetField, Query } from '../../../../common';
import { getIndexPatterns, getQueryService } from '../../../services';
import { IDataPluginServices } from '../../../types';

export const ConfiguratorV2 = ({
  services,
  baseDataset,
  onConfirm,
  onCancel,
  onPrevious,
  alwaysShowDatasetFields,
}: {
  services: IDataPluginServices;
  baseDataset: BaseDataset;
  onConfirm: (query: Partial<Query>, saveDataset?: boolean) => void;
  onCancel: () => void;
  onPrevious: () => void;
  alwaysShowDatasetFields?: boolean;
}) => {
  const queryService = getQueryService();
  const queryString = queryService.queryString;
  const languageService = queryService.queryString.getLanguageService();
  const indexPatternsService = getIndexPatterns();
  const type = queryString.getDatasetService().getType(baseDataset.type);
  const supportedLanguages = type?.supportedLanguages(baseDataset) || [];
  const languages = supportedLanguages.filter(
    (langId) =>
      !services.appName ||
      languageService.getLanguage(langId)?.supportedAppNames?.includes(services.appName)
  );

  const [language, setLanguage] = useState<string>(() => {
    const currentLanguage = queryString.getQuery().language;
    if (languages.includes(currentLanguage)) {
      return currentLanguage;
    }
    return languages[0];
  });

  const [dataset, setDataset] = useState<Dataset>(baseDataset);
  const [timeFields, setTimeFields] = useState<DatasetField[]>([]);
  const [timeFieldName, setTimeFieldName] = useState<string | undefined>(dataset.timeFieldName);
  const noTimeFilter = i18n.translate(
    'data.explorer.datasetSelector.advancedSelector.configurator.timeField.noTimeFieldOptionLabel',
    {
      defaultMessage: "I don't want to use the time filter",
    }
  );
  const [timeFieldsLoading, setTimeFieldsLoading] = useState(false);
  const [saveAsDataset, setSaveAsDataset] = useState(false);

  const isAsyncType = useMemo(() => {
    const datasetType = queryString.getDatasetService().getType(dataset.type);
    return datasetType?.meta.isFieldLoadAsync ?? false;
  }, [dataset.type, queryString]);

  const submitDisabled = useMemo(() => {
    return (
      timeFieldsLoading ||
      (timeFieldName === undefined &&
        !(dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) &&
        timeFields &&
        timeFields.length > 0) ||
      (alwaysShowDatasetFields && isAsyncType)
    );
  }, [dataset, timeFieldName, timeFields, timeFieldsLoading, alwaysShowDatasetFields, isAsyncType]);

  const saveAsDatasetDisabled = useMemo(() => {
    return isAsyncType || dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
  }, [dataset, isAsyncType]);

  useEffect(() => {
    const fetchFields = async () => {
      const datasetType = queryString.getDatasetService().getType(baseDataset.type);
      if (!datasetType) {
        setTimeFields([]);
        return;
      }

      setTimeFieldsLoading(true);
      const datasetFields = await datasetType
        .fetchFields(baseDataset)
        .finally(() => setTimeFieldsLoading(false));
      const dateFields = datasetFields?.filter((field) => field.type === 'date');
      setTimeFields(dateFields || []);
    };

    if (baseDataset?.dataSource?.meta?.supportsTimeFilter === false && timeFields.length > 0) {
      setTimeFields([]);
      return;
    }

    fetchFields();
  }, [baseDataset, indexPatternsService, queryString, timeFields.length]);

  const shouldRenderDatePickerField = useCallback(() => {
    const datasetType = queryString.getDatasetService().getType(dataset.type);

    const supportsTimeField = datasetType?.meta?.supportsTimeFilter;
    if (supportsTimeField !== undefined) {
      return Boolean(supportsTimeField);
    }
    return true;
  }, [dataset.type, queryString]);

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
                setDataset({ ...dataset, language: e.target.value });
              }}
              data-test-subj="advancedSelectorLanguageSelect"
            />
          </EuiFormRow>
          {shouldRenderDatePickerField() &&
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
                    ...timeFields.map((field) => ({
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
                    setDataset({ ...dataset, timeFieldName: value });
                  }}
                  hasNoInitialSelection
                  data-test-subj="advancedSelectorTimeFieldSelect"
                />
              </EuiFormRow>
            ))}
          {!alwaysShowDatasetFields && (
            <>
              <EuiSpacer size="s" />
              <EuiCheckbox
                id="saveAsDatasetCheckbox"
                label={i18n.translate(
                  'data.explorer.datasetSelector.advancedSelector.configurator.saveAsDatasetLabel',
                  {
                    defaultMessage: 'Save as dataset',
                  }
                )}
                checked={saveAsDataset}
                onChange={(e) => setSaveAsDataset(e.target.checked)}
                disabled={saveAsDatasetDisabled}
                data-test-subj="saveAsDatasetCheckbox"
              />
              {saveAsDatasetDisabled && (
                <>
                  <EuiSpacer size="xs" />
                  <EuiText size="xs" color="warning">
                    <p>
                      <FormattedMessage
                        id="data.explorer.datasetSelector.advancedSelector.configurator.asyncTypeWarning"
                        defaultMessage="This data type does not support saving as a dataset."
                      />
                    </p>
                  </EuiText>
                </>
              )}
            </>
          )}
          {(alwaysShowDatasetFields || saveAsDataset) && (
            <>
              <EuiFormRow
                label={i18n.translate(
                  'data.explorer.datasetSelector.advancedSelector.configurator.datasetNameLabel',
                  {
                    defaultMessage: 'Dataset name',
                  }
                )}
              >
                <EuiFieldText
                  value={dataset.displayName || ''}
                  onChange={(e) => {
                    setDataset({ ...dataset, displayName: e.target.value });
                  }}
                  data-test-subj="datasetNameInput"
                />
              </EuiFormRow>
              <EuiFormRow
                label={i18n.translate(
                  'data.explorer.datasetSelector.advancedSelector.configurator.datasetDescriptionLabel',
                  {
                    defaultMessage: 'Dataset description',
                  }
                )}
              >
                <EuiTextArea
                  value={dataset.description || ''}
                  onChange={(e) => {
                    setDataset({ ...dataset, description: e.target.value });
                  }}
                  data-test-subj="datasetDescriptionInput"
                />
              </EuiFormRow>
              {alwaysShowDatasetFields && isAsyncType && (
                <>
                  <EuiSpacer size="s" />
                  <EuiText size="xs" color="warning">
                    <p>
                      <FormattedMessage
                        id="data.explorer.datasetSelector.advancedSelector.configurator.asyncTypeSaveWarning"
                        defaultMessage="This data type does not support saving as a dataset."
                      />
                    </p>
                  </EuiText>
                </>
              )}
            </>
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
            await queryString.getDatasetService().cacheDataset(dataset, services);
            onConfirm({ dataset, language }, shouldSaveDataset || undefined);
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
