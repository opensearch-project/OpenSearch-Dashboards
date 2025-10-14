/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataView } from '../../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../../types';
import { CorrelationSavedObject } from '../../../../../types/correlations';
import {
  useCreateCorrelation,
  useUpdateCorrelation,
} from '../../../../../hooks/use_correlation_mutations';
import { useValidateFieldMappings } from '../../../../../hooks/use_validate_field_mappings';
import { validateMaxLogDatasets } from '../../../../../utils/correlation_validation';
import { extractDatasetIdsFromEntities } from '../../../../../utils/correlation_display';
import { LogsDatasetSelector } from './logs_dataset_selector';
import { ValidationCallout } from './validation_callout';
import { FieldMappingsAccordion } from './field_mappings_accordion';
import { FieldMappingEditor } from './field_mapping_editor';

interface ConfigureCorrelationModalProps {
  traceDataset: DataView;
  existingCorrelation?: CorrelationSavedObject | null;
  onClose: () => void;
  onSave: () => void;
}

export const ConfigureCorrelationModal: React.FC<ConfigureCorrelationModalProps> = ({
  traceDataset,
  existingCorrelation,
  onClose,
  onSave,
}) => {
  const { savedObjects, data, notifications } = useOpenSearchDashboards<
    DatasetManagmentContext
  >().services;

  const [selectedLogDatasetIds, setSelectedLogDatasetIds] = useState<string[]>([]);
  const [maxDatasetsError, setMaxDatasetsError] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<
    Array<{ datasetId: string; mappings: Record<string, string> }>
  >([]);

  const { createCorrelation, loading: creating } = useCreateCorrelation(savedObjects.client);
  const { updateCorrelation, loading: updating } = useUpdateCorrelation(savedObjects.client);

  const { validationResult, loading: validating } = useValidateFieldMappings(
    selectedLogDatasetIds,
    data
  );

  // Initialize form with existing correlation data if editing
  useEffect(() => {
    if (existingCorrelation) {
      // Extract log dataset IDs from entities array
      const { logDatasetIds } = extractDatasetIdsFromEntities(
        existingCorrelation.attributes.entities,
        existingCorrelation.references
      );
      setSelectedLogDatasetIds(logDatasetIds);
    }
  }, [existingCorrelation]);

  // Validate max datasets on change
  useEffect(() => {
    const result = validateMaxLogDatasets(selectedLogDatasetIds);
    setMaxDatasetsError(result.isValid ? '' : result.error || '');
  }, [selectedLogDatasetIds]);

  const handleLogDatasetsChange = useCallback((datasetIds: string[]) => {
    setSelectedLogDatasetIds(datasetIds);
  }, []);

  const handleFieldMappingsChange = useCallback(
    (mappings: Array<{ datasetId: string; mappings: Record<string, string> }>) => {
      setFieldMappings(mappings);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!traceDataset.id) {
      notifications.toasts.addDanger({
        title: i18n.translate('datasetManagement.correlatedDatasets.modal.noTraceDatasetError', {
          defaultMessage: 'Trace dataset ID is missing',
        }),
      });
      return;
    }

    try {
      // Save field mappings for datasets that need them
      if (fieldMappings.length > 0) {
        for (const { datasetId, mappings } of fieldMappings) {
          try {
            const dataView = await data.dataViews.get(datasetId);

            // Update the dataset's schemaMappings.otelLogs
            dataView.schemaMappings = {
              ...dataView.schemaMappings,
              otelLogs: {
                ...dataView.schemaMappings?.otelLogs,
                ...mappings,
              },
            };

            // Save the updated dataset
            await data.dataViews.updateSavedObject(dataView);
          } catch (err) {
            notifications.toasts.addDanger({
              title: i18n.translate(
                'datasetManagement.correlatedDatasets.modal.fieldMappingSaveError',
                {
                  defaultMessage: 'Failed to save field mappings for dataset {datasetId}',
                  values: { datasetId },
                }
              ),
              text: err instanceof Error ? err.message : 'Unknown error',
            });
            return;
          }
        }

        // Show success toast for field mappings update
        notifications.toasts.addSuccess({
          title: i18n.translate(
            'datasetManagement.correlatedDatasets.modal.fieldMappingSaveSuccess',
            {
              defaultMessage: 'Field mappings saved successfully',
            }
          ),
        });
      }

      if (existingCorrelation) {
        // Update existing correlation
        await updateCorrelation({
          id: existingCorrelation.id,
          logDatasetIds: selectedLogDatasetIds,
        });
      } else {
        // Create new correlation
        await createCorrelation({
          traceDatasetId: traceDataset.id,
          logDatasetIds: selectedLogDatasetIds,
        });
      }

      onSave();
    } catch (error) {
      notifications.toasts.addDanger({
        title: i18n.translate('datasetManagement.correlatedDatasets.modal.saveError', {
          defaultMessage: 'Failed to {action} correlation',
          values: {
            action: existingCorrelation ? 'update' : 'create',
          },
        }),
        text: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [
    traceDataset.id,
    existingCorrelation,
    selectedLogDatasetIds,
    fieldMappings,
    data,
    createCorrelation,
    updateCorrelation,
    onSave,
    notifications,
  ]);

  const isLoading = creating || updating || validating;
  const hasFieldMappingErrors = validationResult && !validationResult.isValid;

  // Check if all required field mappings are filled - use useMemo to stabilize reference
  const missingMappings = useMemo(() => {
    return (
      validationResult?.errors
        .filter((err) => err.missingFields && err.missingFields.length > 0)
        .map((err) => ({
          datasetId: err.datasetId,
          datasetTitle: err.datasetTitle,
          missingFields: err.missingFields || [],
        })) || []
    );
  }, [validationResult]);

  const allRequiredMappingsFilled =
    missingMappings.length === 0 ||
    missingMappings.every((missing) => {
      const datasetMapping = fieldMappings.find((fm) => fm.datasetId === missing.datasetId);
      if (!datasetMapping) return false;

      return missing.missingFields.every(
        (field) => datasetMapping.mappings[field] && datasetMapping.mappings[field].length > 0
      );
    });

  const canSave =
    !isLoading &&
    selectedLogDatasetIds.length > 0 &&
    !maxDatasetsError &&
    allRequiredMappingsFilled;

  return (
    <EuiModal
      onClose={onClose}
      style={{ minHeight: '50vh', minWidth: '80vw' }}
      data-test-subj="configureCorrelationModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {existingCorrelation
            ? i18n.translate('datasetManagement.correlatedDatasets.modal.editTitle', {
                defaultMessage: 'Edit correlation',
              })
            : i18n.translate('datasetManagement.correlatedDatasets.modal.createTitle', {
                defaultMessage: 'Configure correlation',
              })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {/* Trace Dataset (read-only) */}
        <EuiDescriptionList>
          <EuiDescriptionListTitle>
            {i18n.translate('datasetManagement.correlatedDatasets.modal.traceDatasetLabel', {
              defaultMessage: 'Trace dataset',
            })}
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription data-test-subj="traceDatasetField">
            {traceDataset.title}
          </EuiDescriptionListDescription>
        </EuiDescriptionList>

        <EuiSpacer size="m" />

        {/* Logs Datasets Selector */}
        <LogsDatasetSelector
          dataService={data}
          selectedDatasetIds={selectedLogDatasetIds}
          onChange={handleLogDatasetsChange}
          isInvalid={!!maxDatasetsError}
          error={maxDatasetsError}
        />

        <EuiSpacer size="m" />

        {/* Field Mapping Editor - shown when datasets have missing mappings */}
        {missingMappings.length > 0 && (
          <>
            <FieldMappingEditor
              dataService={data}
              datasetIds={selectedLogDatasetIds}
              missingMappings={missingMappings}
              onMappingsChange={handleFieldMappingsChange}
            />
            <EuiSpacer size="m" />
          </>
        )}

        {/* Field Mappings Accordion - shown when all datasets have valid mappings */}
        {selectedLogDatasetIds.length > 0 &&
          validationResult &&
          validationResult.isValid &&
          missingMappings.length === 0 && (
            <>
              <FieldMappingsAccordion
                errors={validationResult.errors}
                isValid={validationResult.isValid}
              />
              <EuiSpacer size="m" />
            </>
          )}

        {/* Loading Indicator */}
        {isLoading && (
          <EuiFlexGroup justifyContent="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="l" />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} data-test-subj="cancelCorrelationButton">
          {i18n.translate('datasetManagement.correlatedDatasets.modal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiButtonEmpty>

        <EuiButton
          onClick={handleSave}
          fill
          disabled={!canSave}
          isLoading={isLoading}
          data-test-subj="saveCorrelationButton"
        >
          {i18n.translate('datasetManagement.correlatedDatasets.modal.saveButton', {
            defaultMessage: 'Save',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
