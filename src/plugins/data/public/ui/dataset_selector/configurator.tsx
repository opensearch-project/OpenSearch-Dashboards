/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { BaseDataset, Dataset, DatasetField } from '../../../common';
import { getQueryService, getIndexPatterns } from '../../services';

export const Configurator = ({
  baseDataset,
  onConfirm,
  onCancel,
  onPrevious,
}: {
  baseDataset: BaseDataset;
  onConfirm: (dataset: Dataset) => void;
  onCancel: () => void;
  onPrevious: () => void;
}) => {
  const queryService = getQueryService();
  const queryString = queryService.queryString;
  const indexPatternsService = getIndexPatterns();
  const type = queryString.getDatasetService().getType(baseDataset.type);
  const languages = type?.supportedLanguages(baseDataset) || [];

  const [dataset, setDataset] = useState<Dataset>(baseDataset);
  const [timeFields, setTimeFields] = useState<DatasetField[]>();
  const [timeField, setTimeField] = useState<string | undefined>(dataset.timeFieldName);
  const [language, setLanguage] = useState<string>(languages[0]);

  useEffect(() => {
    const fetchFields = async () => {
      const datasetFields = await queryString
        .getDatasetService()
        .getType(baseDataset.type)
        ?.fetchFields(baseDataset);

      const dateFields = datasetFields?.filter((field) => field.type === 'date');
      setTimeFields(dateFields || []);
    };

    fetchFields();
  }, [baseDataset, indexPatternsService, queryString]);

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
        <EuiForm>
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
          {timeFields && timeFields.length > 0 && (
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
                  { text: '-----', value: '', disabled: true },
                  { text: 'No time field', value: undefined },
                ]}
                value={timeField}
                onChange={(e) => {
                  const value = e.target.value === 'undefined' ? undefined : e.target.value;
                  setTimeField(value);
                  setDataset({ ...dataset, timeFieldName: value });
                }}
              />
            </EuiFormRow>
          )}
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
                text: languageId,
                value: languageId,
              }))}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </EuiFormRow>
        </EuiForm>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel}>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.cancel"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>
        <EuiButton onClick={onPrevious} iconType="arrowLeft" iconSide="left">
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.previous"
            defaultMessage="Previous"
          />
        </EuiButton>
        <EuiButton onClick={() => onConfirm(dataset)} fill>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.confirm"
            defaultMessage="Select Data"
          />
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};
