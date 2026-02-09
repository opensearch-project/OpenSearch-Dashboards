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
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiFormRow,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiFieldText,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiToolTip,
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
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { ValidationCallout } from './validation_callout';
// @ts-expect-error TS6133 TODO(ts-error): fixme
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
  const [allDatasetsReady, setAllDatasetsReady] = useState(false);
  const [validationKey, setValidationKey] = useState(0);
  const [logsSelectorTouched, setLogsSelectorTouched] = useState(false);
  const [isAnyDatasetEditing, setIsAnyDatasetEditing] = useState(false);

  const { createCorrelation, loading: creating } = useCreateCorrelation(savedObjects.client);
  const { updateCorrelation, loading: updating } = useUpdateCorrelation(savedObjects.client);

  const { validationResult, datasets, loading: validating } = useValidateFieldMappings(
    selectedLogDatasetIds,
    data,
    validationKey
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
      setLogsSelectorTouched(true); // Mark as touched since we have existing data
    }
  }, [existingCorrelation]);

  // Validate max datasets on change
  useEffect(() => {
    const result = validateMaxLogDatasets(selectedLogDatasetIds);
    setMaxDatasetsError(result.isValid ? '' : result.error || '');
  }, [selectedLogDatasetIds]);

  const handleLogDatasetsChange = useCallback((datasetIds: string[]) => {
    setSelectedLogDatasetIds(datasetIds);
    setLogsSelectorTouched(true);
  }, []);

  const handleFieldMappingsChange = useCallback(
    (mappings: Array<{ datasetId: string; mappings: Record<string, string> }>) => {
      setFieldMappings(mappings);
    },
    []
  );

  const handleDatasetSaved = useCallback(() => {
    setValidationKey((prev) => prev + 1);
  }, []);

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
      // Schema mappings are already saved individually per dataset
      // Only create/update correlation here

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
          traceDatasetTitle: traceDataset.title,
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
    traceDataset.title,
    existingCorrelation,
    selectedLogDatasetIds,
    createCorrelation,
    updateCorrelation,
    onSave,
    notifications,
  ]);

  const isLoading = creating || updating || validating;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
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

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const allRequiredMappingsFilled =
    missingMappings.length === 0 ||
    missingMappings.every((missing) => {
      const datasetMapping = fieldMappings.find((fm) => fm.datasetId === missing.datasetId);
      if (!datasetMapping) return false;

      return missing.missingFields.every(
        (field) => datasetMapping.mappings[field] && datasetMapping.mappings[field].length > 0
      );
    });

  // Compute tooltip message for disabled save button
  const disabledReason = useMemo(() => {
    if (isLoading) return '';
    if (selectedLogDatasetIds.length === 0) {
      return i18n.translate('datasetManagement.correlatedDatasets.modal.noLogDatasetsTooltip', {
        defaultMessage: 'Please select at least one log dataset',
      });
    }
    if (maxDatasetsError) {
      return maxDatasetsError;
    }
    if (isAnyDatasetEditing) {
      return i18n.translate('datasetManagement.correlatedDatasets.modal.datasetEditingTooltip', {
        defaultMessage: 'Please save or cancel schema mapping changes',
      });
    }
    if (!allDatasetsReady) {
      return i18n.translate('datasetManagement.correlatedDatasets.modal.validatingTooltip', {
        defaultMessage: 'Waiting for datasets to be validated',
      });
    }
    return '';
  }, [isLoading, selectedLogDatasetIds, maxDatasetsError, isAnyDatasetEditing, allDatasetsReady]);

  const canSave =
    !isLoading &&
    selectedLogDatasetIds.length > 0 &&
    !maxDatasetsError &&
    allDatasetsReady &&
    !isAnyDatasetEditing;

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
            {traceDataset.getDisplayName()}
          </EuiDescriptionListDescription>
        </EuiDescriptionList>

        <EuiSpacer size="m" />

        {/* Logs Datasets Selector */}
        <LogsDatasetSelector
          dataService={data}
          selectedDatasetIds={selectedLogDatasetIds}
          onChange={handleLogDatasetsChange}
          isInvalid={logsSelectorTouched && !!maxDatasetsError}
          error={logsSelectorTouched ? maxDatasetsError : ''}
        />

        <EuiSpacer size="m" />

        {/* Field Mapping Editor - shown for all selected datasets */}
        {selectedLogDatasetIds.length > 0 && !validating && datasets.length > 0 && (
          <>
            <FieldMappingEditor
              dataService={data}
              datasetIds={selectedLogDatasetIds}
              datasets={datasets}
              missingMappings={missingMappings}
              // @ts-expect-error TS2322 TODO(ts-error): fixme
              onMappingsChange={handleFieldMappingsChange}
              notifications={notifications}
              onAllDatasetsReady={setAllDatasetsReady}
              onDatasetSaved={handleDatasetSaved}
              onEditingStateChange={setIsAnyDatasetEditing}
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

        <EuiToolTip content={disabledReason} position="top">
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
        </EuiToolTip>
      </EuiModalFooter>
    </EuiModal>
  );
};
