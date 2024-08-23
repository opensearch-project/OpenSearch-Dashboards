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
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Dataset, DataStructure, DEFAULT_DATA } from '../../../common';
import { getQueryService } from '../../services';

export const Configurator = ({
  savedObjects,
  currentDataStructure,
  onConfirm,
  onCancel,
  onPrevious,
}: {
  savedObjects: SavedObjectsClientContract;
  currentDataStructure: DataStructure;
  onConfirm: (dataset: Dataset) => void;
  onCancel: () => void;
  onPrevious: () => void;
}) => {
  // const languageManager = queryService.queryString.getLanguageManager();
  const [timeFields, setTimeFields] = useState<string[]>([]);
  const [timeField, setTimeField] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  // const [selectedLanguage, setSelectedLanguage] = useState<string>(
  //   languageManager.getDefaultLanguage(dataset.type)
  // );

  // if the data structure is already a dataset do not enable the ability to change it through selector
  const isDataset = currentDataStructure.type === DEFAULT_DATA.STRUCTURES.DATASET.type;
  const datasetManager = getQueryService().queryString.getDatasetManager();

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const children = await datasetManager.fetchOptions(savedObjects, currentDataStructure);
        const dateFields = children.filter(
          (child) => child.type === DEFAULT_DATA.STRUCTURES.TIME_FIELD.type
        );
        setTimeFields(dateFields.map((field) => field.title));
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [currentDataStructure, datasetManager, savedObjects]);
  // const supportedLanguages = languageManager.getSupportedLanguages(dataset.type);

  const handleConfirm = () => {
    const dataset = datasetManager.toDataset(currentDataStructure);
    onConfirm({ ...dataset, timeFieldName: timeField });
  };

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
            <EuiFieldText disabled value={currentDataStructure.title} />
          </EuiFormRow>
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
                { text: 'No time field', value: 'undefined' },
              ]}
              value={timeField}
              onChange={(e) => {
                const value = e.target.value === 'undefined' ? undefined : e.target.value;
                setTimeField(value);
              }}
              disabled={isDataset || loading}
              isLoading={loading}
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
        <EuiButton onClick={handleConfirm} fill>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.confirm"
            defaultMessage="Select Data"
          />
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};
