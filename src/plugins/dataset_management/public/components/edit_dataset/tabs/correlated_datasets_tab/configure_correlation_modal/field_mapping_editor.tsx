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
  datasets: any[]; // Pre-fetched DataView objects with schemaMappings
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
  datasets,
  missingMappings,
  onMappingsChange,
}) => {
  const [datasetFieldMappings, setDatasetFieldMappings] = useState<DatasetFieldMappings[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Process pre-fetched datasets to extract field mappings
  useEffect(() => {
    const processDatasets = async () => {
      setLoading(true);
      try {
        const mappings: DatasetFieldMappings[] = [];

        for (const dataView of datasets) {
          try {
            const fields = dataView.fields.getAll();

            // Get dataset title from saved object to get displayName
            let datasetTitle = dataView.title;
            try {
              const savedObject = await dataService.indexPatterns.savedObjectsClient.get(
                'index-pattern',
                dataView.id
              );
              const attributes = savedObject.attributes as any;
              datasetTitle = attributes.displayName || attributes.title || dataView.title;
            } catch (err) {
              // If fetch fails, use dataView.title
            }

            // Extract existing schemaMappings.otelLogs if available
            let existingMappings: FieldMappings = {};
            try {
              // eslint-disable-next-line no-console
              console.log(`[FieldMappingEditor] Processing dataset ${dataView.id}`, {
                schemaMappings: dataView.schemaMappings,
                type: typeof dataView.schemaMappings,
              });

              // DataView.schemaMappings can be either a string (from saved object) or object (already parsed)
              const schemaMappings =
                typeof dataView.schemaMappings === 'string'
                  ? JSON.parse(dataView.schemaMappings)
                  : dataView.schemaMappings;

              if (schemaMappings && schemaMappings.otelLogs) {
                const otelLogs = schemaMappings.otelLogs;
                existingMappings = {
                  traceId: otelLogs.traceId || undefined,
                  spanId: otelLogs.spanId || undefined,
                  serviceName: otelLogs.serviceName || undefined,
                  timestamp: otelLogs.timestamp || undefined,
                };

                // eslint-disable-next-line no-console
                console.log(
                  `[FieldMappingEditor] Extracted mappings for ${dataView.id}:`,
                  existingMappings
                );
              } else {
                // eslint-disable-next-line no-console
                console.log(`[FieldMappingEditor] No otelLogs mappings found for ${dataView.id}`);
              }
            } catch (parseErr) {
              // If parsing fails, use empty mappings
              // eslint-disable-next-line no-console
              console.error(`Failed to parse schemaMappings for dataset ${dataView.id}:`, parseErr);
            }

            mappings.push({
              datasetId: dataView.id || '',
              datasetTitle,
              mappings: existingMappings,
              fields,
            });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to process dataset ${dataView.id}:`, err);
          }
        }

        setDatasetFieldMappings(mappings);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to process datasets:', err);
      } finally {
        setLoading(false);
      }
    };

    if (datasets.length > 0) {
      processDatasets();
    } else {
      setDatasetFieldMappings([]);
    }
  }, [datasets, dataService]);

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

  if (datasets.length === 0) {
    return null;
  }

  // Build table rows from loaded datasets
  const tableRows: TableRow[] = datasetFieldMappings.map((ds) => {
    const missingForDataset = missingMappings.find((m) => m.datasetId === ds.datasetId);
    return {
      datasetId: ds.datasetId,
      datasetTitle: ds.datasetTitle,
      hasError: missingForDataset ? missingForDataset.missingFields.length > 0 : false,
    };
  });

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

  const hasErrors = tableRows.some((row) => row.hasError);

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

        {/* Show error callout only when there are missing mappings */}
        {hasErrors && missingMappings.length > 0 && (
          <>
            <EuiCallOut
              title={i18n.translate(
                'datasetManagement.correlatedDatasets.fieldMapping.calloutTitle',
                {
                  defaultMessage: 'Missing field mappings in Logs datasets',
                }
              )}
              color="danger"
              iconType="alert"
              size="s"
            >
              <p>
                {i18n.translate(
                  'datasetManagement.correlatedDatasets.fieldMapping.calloutMessage',
                  {
                    defaultMessage:
                      'The following datasets are missing fields to correlate with trace data. Ensure the logs dataset contain primary fields:',
                  }
                )}
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
          </>
        )}

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
