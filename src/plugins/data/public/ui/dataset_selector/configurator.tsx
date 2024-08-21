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
import { Dataset } from '../../../common/datasets';
import { getQueryService } from '../../services';
import { IndexPatternsContract } from '../../index_patterns';

export const Configurator = ({
  indexPatternsService,
  dataset,
  onConfirm,
  onCancel,
  onPrevious,
}: {
  indexPatternsService: IndexPatternsContract;
  dataset: Dataset;
  onConfirm: (dataset: Dataset) => void;
  onCancel: () => void;
  onPrevious: () => void;
}) => {
  // const languageManager = queryService.queryString.getLanguageManager();
  const [finalDataset, setFinalDataset] = useState<Dataset>(dataset);
  const [timeFields, setTimeFields] = useState<string[]>();
  const [timeField, setTimeField] = useState<string | undefined>(dataset.timeFieldName);
  // const [selectedLanguage, setSelectedLanguage] = useState<string>(
  //   languageManager.getDefaultLanguage(dataset.type)
  // );

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await indexPatternsService.getFieldsForWildcard({
        pattern: dataset.title,
      });
      const dateFields = fields.filter((field: any) => field.type === 'date');
      setTimeFields(dateFields.map((field: any) => field.name));
    };

    fetchFields();
  }, [dataset, indexPatternsService]);

  // const supportedLanguages = languageManager.getSupportedLanguages(dataset.type);

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
                  ...timeFields.map((field) => ({ text: field, value: field })),
                  { text: '-----', value: '', disabled: true },
                  { text: 'No time field', value: undefined },
                ]}
                value={timeField}
                onChange={(e) => {
                  const value = e.target.value === 'undefined' ? undefined : e.target.value;
                  setTimeField(value);
                  setFinalDataset({ ...finalDataset, timeFieldName: value });
                }}
              />
            </EuiFormRow>
          )}
          {/* <EuiFormRow
            label={i18n.translate(
              'data.explorer.datasetSelector.advancedSelector.configurator.languageLabel',
              {
                defaultMessage: 'Language',
              }
            )}
          >
            <EuiSelect
              options={supportedLanguages.map((language: any) => ({
                text: language,
                value: language,
              }))}
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            />
          </EuiFormRow> */}
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
        <EuiButton onClick={() => onConfirm({ ...finalDataset })} fill>
          {/* <EuiButton onClick={() => onConfirm({ ...finalDataset, language: selectedLanguage })} fill> */}
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.confirm"
            defaultMessage="Select Data"
          />
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};
