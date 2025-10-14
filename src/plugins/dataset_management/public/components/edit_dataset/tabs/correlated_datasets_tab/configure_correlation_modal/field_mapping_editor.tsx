/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EuiSpacer,
  EuiCallOut,
  EuiAccordion,
  EuiText,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiHealth,
  EuiIcon,
  EuiComboBox,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataPublicPluginStart, IndexPatternField } from '../../../../../../../data/public';

interface FieldMappings {
  traceId?: string;
  spanId?: string;
  serviceName?: string;
  timestamp?: string;
}

interface DatasetFieldMappings {
  datasetId: string;
  datasetTitle: string;
  mappings: FieldMappings;
  fields: IndexPatternField[];
}

interface FieldMappingEditorProps {
  dataService: DataPublicPluginStart;
  datasetIds: string[];
  missingMappings: Array<{
    datasetId: string;
    datasetTitle: string;
    missingFields: string[];
  }>;
  onMappingsChange: (
    datasetMappings: Array<{ datasetId: string; mappings: FieldMappings }>
  ) => void;
}

interface TableRow {
  datasetId: string;
  datasetTitle: string;
  hasError: boolean;
}

const TIME_FIELD_TYPES = ['date', 'date_nanos'];

const REQUIRED_FIELDS: Array<keyof FieldMappings> = [
  'traceId',
  'spanId',
  'serviceName',
  'timestamp',
];

// Separate component for the field selector to avoid re-render issues
const FieldSelector: React.FC<{
  datasetId: string;
  fieldName: keyof FieldMappings;
  fields: IndexPatternField[];
  selectedValue: string | undefined;
  onChange: (datasetId: string, fieldName: keyof FieldMappings, value: string | undefined) => void;
}> = React.memo(({ datasetId, fieldName, fields, selectedValue, onChange }) => {
  const isTimestamp = fieldName === 'timestamp';
  const filteredFields = isTimestamp
    ? fields.filter((field) => TIME_FIELD_TYPES.includes(field.type))
    : fields;

  const options: Array<EuiComboBoxOptionOption<string>> = filteredFields.map((field) => ({
    label: field.name,
  }));

  const selectedOptions = selectedValue ? [{ label: selectedValue }] : [];

  const handleChange = (selected: Array<EuiComboBoxOptionOption<string>>) => {
    if (selected.length > 0) {
      onChange(datasetId, fieldName, selected[0].label);
    } else {
      onChange(datasetId, fieldName, undefined);
    }
  };

  return (
    <EuiComboBox
      compressed
      placeholder={i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.selectField', {
        defaultMessage: 'Select field',
      })}
      singleSelection={{ asPlainText: true }}
      options={options}
      selectedOptions={selectedOptions}
      onChange={handleChange}
      isClearable={true}
      fullWidth
      data-test-subj={`fieldSelector-${fieldName}-${datasetId}`}
    />
  );
});

FieldSelector.displayName = 'FieldSelector';

export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({
  dataService,
  datasetIds,
  missingMappings,
  onMappingsChange,
}) => {
  const [datasetFieldMappings, setDatasetFieldMappings] = useState<DatasetFieldMappings[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load dataset fields
  useEffect(() => {
    const loadDatasetFields = async () => {
      setLoading(true);
      try {
        const mappings: DatasetFieldMappings[] = [];

        for (const { datasetId, datasetTitle, missingFields } of missingMappings) {
          try {
            const dataView = await dataService.dataViews.get(datasetId);
            const fields = dataView.fields.getAll();

            mappings.push({
              datasetId,
              datasetTitle,
              mappings: {},
              fields,
            });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch fields for dataset ${datasetId}:`, err);
          }
        }

        setDatasetFieldMappings(mappings);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load dataset fields:', err);
      } finally {
        setLoading(false);
      }
    };

    if (missingMappings.length > 0) {
      loadDatasetFields();
    }
  }, [dataService, missingMappings]);

  const handleFieldChange = useCallback(
    (datasetId: string, fieldName: keyof FieldMappings, value: string | undefined) => {
      setDatasetFieldMappings((prev) => {
        const updated = prev.map((ds) => {
          if (ds.datasetId === datasetId) {
            return {
              ...ds,
              mappings: {
                ...ds.mappings,
                [fieldName]: value,
              },
            };
          }
          return ds;
        });

        // Debounce parent notification to avoid excessive re-renders
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          onMappingsChange(
            updated.map((ds) => ({
              datasetId: ds.datasetId,
              mappings: ds.mappings,
            }))
          );
        }, 300);

        return updated;
      });
    },
    [onMappingsChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (missingMappings.length === 0) {
    return null;
  }

  const columns: Array<EuiBasicTableColumn<TableRow>> = [
    {
      field: 'datasetTitle',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.logsDatasetColumn', {
        defaultMessage: 'Logs dataset',
      }),
      width: '200px',
      render: (title: string, row: TableRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {row.hasError && <EuiIcon type="alert" color="danger" size="m" />}
          <span>{title}</span>
        </div>
      ),
    },
    {
      field: 'timestamp',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.timestampColumn', {
        defaultMessage: 'Timefield',
      }),
      render: (_: any, row: TableRow) => {
        const dataset = datasetFieldMappings.find((ds) => ds.datasetId === row.datasetId);
        if (!dataset) return null;

        const missing = missingMappings.find((m) => m.datasetId === row.datasetId);
        const isRequired = missing?.missingFields.includes('timestamp');

        if (!isRequired && dataset.mappings.timestamp) {
          return <span>{dataset.mappings.timestamp}</span>;
        }

        return (
          <FieldSelector
            datasetId={row.datasetId}
            fieldName="timestamp"
            fields={dataset.fields}
            selectedValue={dataset.mappings.timestamp}
            onChange={handleFieldChange}
          />
        );
      },
    },
    {
      field: 'traceId',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.traceIdColumn', {
        defaultMessage: 'Trace Id',
      }),
      render: (_: any, row: TableRow) => {
        const dataset = datasetFieldMappings.find((ds) => ds.datasetId === row.datasetId);
        if (!dataset) return null;

        const missing = missingMappings.find((m) => m.datasetId === row.datasetId);
        const isRequired = missing?.missingFields.includes('traceId');

        if (!isRequired && dataset.mappings.traceId) {
          return <span>{dataset.mappings.traceId}</span>;
        }

        return (
          <FieldSelector
            datasetId={row.datasetId}
            fieldName="traceId"
            fields={dataset.fields}
            selectedValue={dataset.mappings.traceId}
            onChange={handleFieldChange}
          />
        );
      },
    },
    {
      field: 'spanId',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.spanIdColumn', {
        defaultMessage: 'Span Id',
      }),
      render: (_: any, row: TableRow) => {
        const dataset = datasetFieldMappings.find((ds) => ds.datasetId === row.datasetId);
        if (!dataset) return null;

        const missing = missingMappings.find((m) => m.datasetId === row.datasetId);
        const isRequired = missing?.missingFields.includes('spanId');

        if (!isRequired && dataset.mappings.spanId) {
          return <span>{dataset.mappings.spanId}</span>;
        }

        return (
          <FieldSelector
            datasetId={row.datasetId}
            fieldName="spanId"
            fields={dataset.fields}
            selectedValue={dataset.mappings.spanId}
            onChange={handleFieldChange}
          />
        );
      },
    },
    {
      field: 'serviceName',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.serviceNameColumn', {
        defaultMessage: 'Service name',
      }),
      render: (_: any, row: TableRow) => {
        const dataset = datasetFieldMappings.find((ds) => ds.datasetId === row.datasetId);
        if (!dataset) return null;

        const missing = missingMappings.find((m) => m.datasetId === row.datasetId);
        const isRequired = missing?.missingFields.includes('serviceName');

        if (!isRequired && dataset.mappings.serviceName) {
          return <span>{dataset.mappings.serviceName}</span>;
        }

        return (
          <FieldSelector
            datasetId={row.datasetId}
            fieldName="serviceName"
            fields={dataset.fields}
            selectedValue={dataset.mappings.serviceName}
            onChange={handleFieldChange}
          />
        );
      },
    },
  ];

  const tableRows: TableRow[] = missingMappings.map((missing) => ({
    datasetId: missing.datasetId,
    datasetTitle: missing.datasetTitle,
    hasError: missing.missingFields.length > 0,
  }));

  return (
    <>
      <EuiAccordion
        id="manage-dataset-field-mappings"
        buttonContent={i18n.translate(
          'datasetManagement.correlatedDatasets.fieldMapping.accordionTitle',
          {
            defaultMessage: 'Manage dataset field mappings',
          }
        )}
        paddingSize="none"
        initialIsOpen={true}
        data-test-subj="manageFieldMappingsAccordion"
      >
        <EuiSpacer size="s" />
        <EuiCallOut
          title={i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.calloutTitle', {
            defaultMessage: 'Missing field mappings in Logs datasets',
          })}
          color="danger"
          iconType="alert"
          size="s"
        >
          <p>
            {i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.calloutMessage', {
              defaultMessage:
                'The following datasets are missing fields to correlate with trace data. Ensure the logs dataset contain primary fields:',
            })}
          </p>
          <ul>
            {missingMappings.map((missing) => (
              <li key={missing.datasetId}>
                <strong>{missing.datasetTitle}</strong>
              </li>
            ))}
          </ul>
        </EuiCallOut>

        <EuiSpacer size="m" />

        <EuiBasicTable
          items={tableRows}
          columns={columns}
          loading={loading}
          data-test-subj="fieldMappingTable"
        />
      </EuiAccordion>
    </>
  );
};
