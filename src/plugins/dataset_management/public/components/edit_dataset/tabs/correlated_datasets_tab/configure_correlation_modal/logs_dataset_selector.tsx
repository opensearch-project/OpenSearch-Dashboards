/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiComboBox, EuiComboBoxOptionOption, EuiFormRow, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { DataPublicPluginStart, DataView } from '../../../../../../../data/public';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { MAX_LOG_DATASETS_PER_CORRELATION } from '../../../../../types/correlations';

interface LogsDatasetSelectorProps {
  dataService: DataPublicPluginStart;
  selectedDatasetIds: string[];
  onChange: (datasetIds: string[]) => void;
  isInvalid?: boolean;
  error?: string;
}

interface DatasetOptionData {
  id: string;
  displayName?: string;
  title: string;
}

// Custom option component for rendering dataset options (simple single-line layout)
const DatasetOption: React.FC<{ option: EuiComboBoxOptionOption<DatasetOptionData> }> = ({
  option,
}) => {
  const displayName = option.value?.displayName || option.value?.title || option.label;

  return <EuiText size="s">{displayName}</EuiText>;
};

export const LogsDatasetSelector: React.FC<LogsDatasetSelectorProps> = ({
  dataService,
  selectedDatasetIds,
  onChange,
  isInvalid = false,
  error,
}) => {
  const [options, setOptions] = useState<Array<EuiComboBoxOptionOption<DatasetOptionData>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogsDatasets = async () => {
      setIsLoading(true);
      try {
        const allDataViews = await dataService.dataViews.getIdsWithTitle(true);
        const logsDatasetOptions: Array<EuiComboBoxOptionOption<DatasetOptionData>> = [];

        // Filter for logs datasets only
        for (const { id, title } of allDataViews) {
          try {
            const dataView = await dataService.dataViews.get(id);
            if (dataView.signalType === 'logs') {
              // Use getDisplayName() which returns displayName || title
              const displayName = dataView.getDisplayName();

              logsDatasetOptions.push({
                label: displayName,
                value: {
                  id,
                  displayName,
                  title,
                },
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

  const selectedOptions = options.filter((opt) => selectedDatasetIds.includes(opt.value?.id || ''));

  const handleChange = (selectedOpts: Array<EuiComboBoxOptionOption<DatasetOptionData>>) => {
    const newIds = selectedOpts.map((opt) => opt.value?.id || '').filter((id) => id);
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
        renderOption={(option) => <DatasetOption option={option} />}
        isLoading={isLoading}
        fullWidth
        data-test-subj="logsDatasetSelector"
        isClearable={true}
      />
    </EuiFormRow>
  );
};
