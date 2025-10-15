/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiComboBox, EuiComboBoxOptionOption, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataPublicPluginStart, DataView } from '../../../../../../../data/public';
import { MAX_LOG_DATASETS_PER_CORRELATION } from '../../../../../types/correlations';

interface LogsDatasetSelectorProps {
  dataService: DataPublicPluginStart;
  selectedDatasetIds: string[];
  onChange: (datasetIds: string[]) => void;
  isInvalid?: boolean;
  error?: string;
}

export const LogsDatasetSelector: React.FC<LogsDatasetSelectorProps> = ({
  dataService,
  selectedDatasetIds,
  onChange,
  isInvalid = false,
  error,
}) => {
  const [options, setOptions] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogsDatasets = async () => {
      setIsLoading(true);
      try {
        const allDataViews = await dataService.dataViews.getIdsWithTitle();
        const logsDatasetOptions: Array<EuiComboBoxOptionOption<string>> = [];

        // Filter for logs datasets only
        for (const { id, title } of allDataViews) {
          try {
            const dataView = await dataService.dataViews.get(id);
            if (dataView.signalType === 'logs') {
              logsDatasetOptions.push({
                label: title,
                value: id,
              });
            }
          } catch (err) {
            // Skip datasets that can't be fetched
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch dataset ${id}:`, err);
          }
        }

        setOptions(logsDatasetOptions);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch logs datasets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogsDatasets();
  }, [dataService]);

  const selectedOptions = options.filter((opt) => selectedDatasetIds.includes(opt.value as string));

  const handleChange = (selectedOpts: Array<EuiComboBoxOptionOption<string>>) => {
    const newIds = selectedOpts.map((opt) => opt.value as string);
    onChange(newIds);
  };

  return (
    <EuiFormRow
      label={i18n.translate('datasetManagement.correlatedDatasets.modal.logsDatasetSelectorLabel', {
        defaultMessage: 'Logs datasets',
      })}
      helpText={i18n.translate(
        'datasetManagement.correlatedDatasets.modal.logsDatasetSelectorHelp',
        {
          defaultMessage: 'Select one or more Logs datasets to correlate with traces.',
        }
      )}
      isInvalid={isInvalid}
      error={error}
      fullWidth
    >
      <EuiComboBox
        placeholder={i18n.translate(
          'datasetManagement.correlatedDatasets.modal.logsDatasetSelectorPlaceholder',
          {
            defaultMessage: 'Select logs datasets',
          }
        )}
        options={options}
        selectedOptions={selectedOptions}
        onChange={handleChange}
        isLoading={isLoading}
        fullWidth
        data-test-subj="logsDatasetSelector"
        isClearable={true}
      />
    </EuiFormRow>
  );
};
