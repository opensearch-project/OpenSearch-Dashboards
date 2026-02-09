/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EuiSpacer,
  EuiCallOut,
  EuiAccordion,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiText,
  EuiBasicTable,
  EuiBasicTableColumn,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiHealth,
  EuiIcon,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataPublicPluginStart, IndexPatternField } from '../../../../../../../data/public';
import { NotificationsStart } from '../../../../../../../../core/public';

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
  notifications: NotificationsStart;
  onAllDatasetsReady?: (ready: boolean) => void;
  onDatasetSaved?: () => void;
  onEditingStateChange?: (isEditing: boolean) => void;
}

interface TableRow {
  datasetId: string;
  datasetTitle: string;
  hasError: boolean;
  isComplete: boolean;
}

const TIME_FIELD_TYPES = ['date'];
const STRING_FIELD_TYPES = ['string'];

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
  isInvalid?: boolean;
}> = React.memo(({ datasetId, fieldName, fields, selectedValue, onChange, isInvalid }) => {
  const isTimestamp = fieldName === 'timestamp';
  const isStringField = ['traceId', 'spanId', 'serviceName'].includes(fieldName);

  const filteredFields = isTimestamp
    ? fields.filter((field) => TIME_FIELD_TYPES.includes(field.type))
    : isStringField
    ? fields.filter((field) => STRING_FIELD_TYPES.includes(field.type))
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
      isInvalid={isInvalid}
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
  notifications,
  onAllDatasetsReady,
  onDatasetSaved,
  onEditingStateChange,
}) => {
  const [datasetFieldMappings, setDatasetFieldMappings] = useState<DatasetFieldMappings[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [editingDatasetId, setEditingDatasetId] = useState<string | null>(null);
  const [originalMappings, setOriginalMappings] = useState<Record<string, FieldMappings>>({});
  const [savingDatasetId, setSavingDatasetId] = useState<string | null>(null);
  const [completedDatasets, setCompletedDatasets] = useState<Set<string>>(new Set());
  const [invalidFields, setInvalidFields] = useState<Record<string, Set<keyof FieldMappings>>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialized = useRef(false);
  const originalMappingsInitialized = useRef(false);

  // Helper function to check if dataset is complete
  const isDatasetComplete = useCallback(
    (datasetId: string) => {
      const dataset = datasetFieldMappings.find((ds) => ds.datasetId === datasetId);
      if (!dataset) return false;

      return REQUIRED_FIELDS.every(
        // @ts-expect-error TS2532 TODO(ts-error): fixme
        (field) => dataset.mappings[field] && dataset.mappings[field].length > 0
      );
    },
    [datasetFieldMappings]
  );

  // Process pre-fetched datasets to extract field mappings
  useEffect(() => {
    const processDatasets = async () => {
      setLoading(true);
      try {
        const mappings: DatasetFieldMappings[] = [];

        for (const dataView of datasets) {
          try {
            const fields = dataView.fields.getAll();

            // Get dataset title from saved object
            let datasetTitle = dataView.title;
            try {
              // @ts-expect-error TS2339 TODO(ts-error): fixme
              const savedObject = await dataService.indexPatterns.savedObjectsClient.get(
                'index-pattern',
                dataView.id
              );
              const attributes = savedObject.attributes as any;
              // Use displayName if available, fallback to title
              datasetTitle = attributes.displayName || attributes.title || dataView.title;
            } catch (err) {
              // If fetch fails, use dataView.title
            }

            // Extract existing schemaMappings.otelLogs if available
            let existingMappings: FieldMappings = {};
            try {
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

  // Store original mappings ONLY on initial load (for cancel functionality)
  useEffect(() => {
    if (originalMappingsInitialized.current || datasetFieldMappings.length === 0) return;

    const original: Record<string, FieldMappings> = {};
    datasetFieldMappings.forEach((ds) => {
      original[ds.datasetId] = { ...ds.mappings };
    });
    setOriginalMappings(original);
    originalMappingsInitialized.current = true;
  }, [datasetFieldMappings]);

  // Track completed datasets ONLY on initial load from saved objects
  useEffect(() => {
    if (hasInitialized.current || datasetFieldMappings.length === 0) return;

    const completed = new Set<string>();
    datasetFieldMappings.forEach((ds) => {
      if (isDatasetComplete(ds.datasetId)) {
        completed.add(ds.datasetId);
      }
    });

    setCompletedDatasets(completed);
    hasInitialized.current = true;
  }, [datasetFieldMappings, isDatasetComplete]);

  const handleFieldChange = useCallback(
    (datasetId: string, fieldName: keyof FieldMappings, value: string | undefined) => {
      // Clear invalid state for this field when user changes it
      setInvalidFields((prev) => {
        if (prev[datasetId]) {
          const newSet = new Set(prev[datasetId]);
          newSet.delete(fieldName);
          if (newSet.size === 0) {
            const { [datasetId]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [datasetId]: newSet };
        }
        return prev;
      });

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

  // Handler to start editing a dataset
  const handleStartEdit = useCallback(
    (datasetId: string) => {
      // If there's already a dataset being edited, revert its changes first
      if (editingDatasetId !== null && editingDatasetId !== datasetId) {
        // Revert previous dataset to original mappings
        setDatasetFieldMappings((prev) =>
          prev.map((ds) =>
            ds.datasetId === editingDatasetId
              ? { ...ds, mappings: { ...originalMappings[editingDatasetId] } }
              : ds
          )
        );

        // Clear invalid fields for previous dataset
        setInvalidFields((prev) => {
          const { [editingDatasetId]: _, ...rest } = prev;
          return rest;
        });
      }

      // Now switch to the new dataset
      setEditingDatasetId(datasetId);
    },
    [editingDatasetId, originalMappings]
  );

  // Handler to cancel editing and revert changes
  const handleCancelEdit = useCallback(
    (datasetId: string) => {
      // Revert to original mappings
      setDatasetFieldMappings((prev) =>
        prev.map((ds) =>
          ds.datasetId === datasetId ? { ...ds, mappings: { ...originalMappings[datasetId] } } : ds
        )
      );

      // Clear invalid fields for this dataset
      setInvalidFields((prev) => {
        const { [datasetId]: _, ...rest } = prev;
        return rest;
      });

      setEditingDatasetId(null);
    },
    [originalMappings]
  );

  // Handler to save dataset schema mappings
  const handleSaveDataset = useCallback(
    async (datasetId: string) => {
      const dataset = datasetFieldMappings.find((ds) => ds.datasetId === datasetId);
      if (!dataset) return;

      // Validate that all required fields are filled
      const missingFields = REQUIRED_FIELDS.filter(
        // @ts-expect-error TS2532 TODO(ts-error): fixme
        (field) => !dataset.mappings[field] || dataset.mappings[field].trim() === ''
      );

      if (missingFields.length > 0) {
        // Mark fields as invalid
        setInvalidFields((prev) => ({
          ...prev,
          [datasetId]: new Set(missingFields),
        }));

        // Show error toast
        notifications.toasts.addDanger({
          title: i18n.translate(
            'datasetManagement.correlatedDatasets.fieldMapping.validationErrorTitle',
            {
              defaultMessage: 'Missing required fields',
            }
          ),
          text: i18n.translate(
            'datasetManagement.correlatedDatasets.fieldMapping.validationErrorText',
            {
              defaultMessage: 'Please select values for all required fields: {fields}',
              values: {
                fields: missingFields.join(', '),
              },
            }
          ),
        });
        return;
      }

      setSavingDatasetId(datasetId);
      try {
        const dataView = await dataService.dataViews.get(datasetId);

        // Update schema mappings
        dataView.schemaMappings = {
          ...dataView.schemaMappings,
          otelLogs: { ...dataset.mappings },
        };

        await dataService.dataViews.updateSavedObject(dataView);

        // Update original mappings after successful save
        setOriginalMappings((prev) => ({
          ...prev,
          [datasetId]: { ...dataset.mappings },
        }));

        // Update completed datasets if all fields are now filled
        if (isDatasetComplete(datasetId)) {
          setCompletedDatasets((prev) => new Set([...prev, datasetId]));
        }

        // Clear invalid fields after successful save
        setInvalidFields((prev) => {
          const { [datasetId]: _, ...rest } = prev;
          return rest;
        });

        setEditingDatasetId(null);

        // Show success toast
        notifications.toasts.addSuccess({
          title: i18n.translate(
            'datasetManagement.correlatedDatasets.fieldMapping.saveSuccessTitle',
            {
              defaultMessage: 'Field mappings saved for {datasetTitle}',
              values: { datasetTitle: dataset.datasetTitle },
            }
          ),
        });

        // Notify parent to re-check if all datasets are ready
        onMappingsChange(
          datasetFieldMappings.map((ds) => ({
            datasetId: ds.datasetId,
            mappings: ds.mappings,
          }))
        );

        // Trigger re-validation in parent
        onDatasetSaved?.();
      } catch (error) {
        notifications.toasts.addDanger({
          title: i18n.translate(
            'datasetManagement.correlatedDatasets.fieldMapping.saveErrorTitle',
            {
              defaultMessage: 'Failed to save field mappings',
            }
          ),
          text: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setSavingDatasetId(null);
      }
    },
    [datasetFieldMappings, dataService, isDatasetComplete, notifications, onMappingsChange] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Build table rows from loaded datasets
  const tableRows: TableRow[] = datasetFieldMappings.map((ds) => {
    const missingForDataset = missingMappings.find((m) => m.datasetId === ds.datasetId);
    const isComplete = completedDatasets.has(ds.datasetId);

    return {
      datasetId: ds.datasetId,
      datasetTitle: ds.datasetTitle,
      hasError: missingForDataset ? missingForDataset.missingFields.length > 0 : false,
      isComplete,
    };
  });

  const hasErrors = tableRows.some((row) => row.hasError);

  // Auto-open accordion when there are missing mappings
  useEffect(() => {
    if (hasErrors && missingMappings.length > 0) {
      setIsAccordionOpen(true);
    }
  }, [hasErrors, missingMappings.length]);

  // Track and emit readiness state
  useEffect(() => {
    const allReady =
      datasetFieldMappings.length > 0 && completedDatasets.size === datasetFieldMappings.length;
    onAllDatasetsReady?.(allReady);
  }, [datasetFieldMappings, completedDatasets, onAllDatasetsReady]);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingStateChange?.(editingDatasetId !== null);
  }, [editingDatasetId, onEditingStateChange]);

  if (datasets.length === 0) {
    return null;
  }

  const columns: Array<EuiBasicTableColumn<TableRow>> = [
    {
      field: 'datasetTitle',
      name: i18n.translate('datasetManagement.correlatedDatasets.fieldMapping.logsDatasetColumn', {
        defaultMessage: 'Logs dataset',
      }),
      width: '250px',
      render: (title: string, row: TableRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Icon */}
          {row.isComplete ? (
            <EuiIcon type="check" color="success" size="m" />
          ) : (
            <EuiIcon type="alert" color="danger" size="m" />
          )}

          {/* Dataset Name */}
          <span style={{ flex: 1 }}>{title}</span>

          {/* Action Icons */}
          {editingDatasetId === row.datasetId ? (
            <>
              <EuiButtonIcon
                iconType="cross"
                onClick={() => handleCancelEdit(row.datasetId)}
                aria-label="Cancel"
                disabled={savingDatasetId === row.datasetId}
                data-test-subj={`cancelEdit-${row.datasetId}`}
              />
              <EuiButtonIcon
                iconType="save"
                onClick={() => handleSaveDataset(row.datasetId)}
                aria-label="Save"
                // @ts-expect-error TS2322 TODO(ts-error): fixme
                isLoading={savingDatasetId === row.datasetId}
                disabled={savingDatasetId === row.datasetId}
                data-test-subj={`saveDataset-${row.datasetId}`}
              />
            </>
          ) : (
            <EuiButtonIcon
              iconType="pencil"
              onClick={() => handleStartEdit(row.datasetId)}
              aria-label="Edit"
              data-test-subj={`editDataset-${row.datasetId}`}
            />
          )}
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

        // If in edit mode for this dataset, show selector
        if (editingDatasetId === row.datasetId) {
          const isInvalid = invalidFields[row.datasetId]?.has('timestamp') || false;
          return (
            <FieldSelector
              datasetId={row.datasetId}
              fieldName="timestamp"
              fields={dataset.fields}
              selectedValue={dataset.mappings.timestamp}
              onChange={handleFieldChange}
              isInvalid={isInvalid}
            />
          );
        }

        // Otherwise show read-only text
        return <span>{dataset.mappings.timestamp || '—'}</span>;
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

        // If in edit mode for this dataset, show selector
        if (editingDatasetId === row.datasetId) {
          const isInvalid = invalidFields[row.datasetId]?.has('traceId') || false;
          return (
            <FieldSelector
              datasetId={row.datasetId}
              fieldName="traceId"
              fields={dataset.fields}
              selectedValue={dataset.mappings.traceId}
              onChange={handleFieldChange}
              isInvalid={isInvalid}
            />
          );
        }

        // Otherwise show read-only text
        return <span>{dataset.mappings.traceId || '—'}</span>;
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

        // If in edit mode for this dataset, show selector
        if (editingDatasetId === row.datasetId) {
          const isInvalid = invalidFields[row.datasetId]?.has('spanId') || false;
          return (
            <FieldSelector
              datasetId={row.datasetId}
              fieldName="spanId"
              fields={dataset.fields}
              selectedValue={dataset.mappings.spanId}
              onChange={handleFieldChange}
              isInvalid={isInvalid}
            />
          );
        }

        // Otherwise show read-only text
        return <span>{dataset.mappings.spanId || '—'}</span>;
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

        // If in edit mode for this dataset, show selector
        if (editingDatasetId === row.datasetId) {
          const isInvalid = invalidFields[row.datasetId]?.has('serviceName') || false;
          return (
            <FieldSelector
              datasetId={row.datasetId}
              fieldName="serviceName"
              fields={dataset.fields}
              selectedValue={dataset.mappings.serviceName}
              onChange={handleFieldChange}
              isInvalid={isInvalid}
            />
          );
        }

        // Otherwise show read-only text
        return <span>{dataset.mappings.serviceName || '—'}</span>;
      },
    },
  ];

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
        initialIsOpen={false}
        forceState={isAccordionOpen ? 'open' : 'closed'}
        onToggle={(isOpen) => setIsAccordionOpen(isOpen)}
        data-test-subj="manageFieldMappingsAccordion"
      >
        <EuiSpacer size="s" />

        {/* Show success banner when all datasets are ready */}
        {!hasErrors &&
          datasetFieldMappings.length > 0 &&
          completedDatasets.size === datasetFieldMappings.length && (
            <>
              <EuiCallOut
                title={i18n.translate(
                  'datasetManagement.correlatedDatasets.fieldMapping.successTitle',
                  {
                    defaultMessage: 'All logs datasets are ready for correlation',
                  }
                )}
                color="success"
                iconType="check"
                size="s"
              />
              <EuiSpacer size="m" />
            </>
          )}

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
                      'The following datasets are missing fields to correlate with trace data. Click the pencil icon to configure field mappings:',
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
