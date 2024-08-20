/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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
import { Dataset, DatasetPathItem } from '../../../common/data_sets';
import { mockDatasetManager } from './__mocks__/utils';

export const Configurator = ({
  dataset,
  path,
  onConfirm,
  onCancel,
  onPrevious,
}: {
  dataset: Dataset;
  path: DatasetPathItem[];
  onConfirm: (dataset: Dataset) => void;
  onCancel: () => void;
  onPrevious: () => void;
}) => {
  const datasetType = mockDatasetManager.getType(dataset.type);
  const [finalDataset, setFinalDataset] = React.useState<Dataset>(dataset);
  const [timeFields, setTimeFields] = React.useState<string[]>();
  const [timeField, setTimeField] = React.useState<string>();
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(
    datasetType.config.supportedLanguages[0]
  ); // TODO: set the default language from the language manager and dataset supported languages

  useEffect(() => {
    datasetType.getFields(dataset).then((fields) => {
      const filteredFields = fields.filter((f) => f.type === 'date');
      const defaultTimeField = filteredFields.find((f) => f.type === 'date')?.name;
      setTimeField(defaultTimeField);
      setTimeFields(filteredFields.map((f) => f.name));
      setFinalDataset((prev) => {
        return {
          ...prev,
          timeField: defaultTimeField,
        };
      });
    });
  }, [dataset, datasetType]);

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
          {datasetType && datasetType.config.hasTimeField && (
            <EuiFormRow
              label={i18n.translate(
                'data.explorer.datasetSelector.advancedSelector.configurator.timeFieldLabel',
                {
                  defaultMessage: 'Time field',
                }
              )}
            >
              <EuiSelect
                isLoading={timeFields === undefined}
                options={[
                  ...(timeFields?.map((field) => ({ text: field, value: field })) || []),
                  { text: '-----', value: '', disabled: true },
                  { text: 'No time field', value: undefined },
                ]}
                value={timeField}
                onChange={(e) => setTimeField(e.target.value)}
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
              options={datasetType.config.supportedLanguages.map((lang) => ({
                text: lang,
                value: lang,
              }))}
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            />
          </EuiFormRow>
        </EuiForm>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={() => onCancel()}>
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
        <EuiButton
          disabled={datasetType?.config.hasTimeField && !timeFields}
          onClick={() => onConfirm(finalDataset)}
          fill
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
