/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldMappingError, REQUIRED_OTEL_LOGS_FIELDS } from '../../../../../types/correlations';

interface FieldMappingsTableProps {
  errors: FieldMappingError[];
}

export const FieldMappingsTable: React.FC<FieldMappingsTableProps> = ({ errors }) => {
  // Build table data from errors
  const items = errors.map((error) => {
    const mappingStatus: { [key: string]: boolean } = {};
    REQUIRED_OTEL_LOGS_FIELDS.forEach((field) => {
      mappingStatus[field] = !error.missingFields.includes(field);
    });

    return {
      dataset: error.datasetTitle,
      datasetId: error.datasetId,
      ...mappingStatus,
    };
  });

  const columns = [
    {
      field: 'dataset',
      name: i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappings.dataset', {
        defaultMessage: 'Logs dataset',
      }),
      width: '30%',
    },
    {
      field: 'timestamp',
      name: i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappings.timestamp', {
        defaultMessage: 'TimeField',
      }),
      render: (hasMapping: boolean) => {
        return hasMapping ? (
          <EuiIcon type="check" color="success" />
        ) : (
          <EuiToolTip
            content={i18n.translate(
              'datasetManagement.correlatedDatasets.modal.fieldMappings.missingTooltip',
              {
                defaultMessage: 'Field mapping missing',
              }
            )}
          >
            <EuiIcon type="cross" color="danger" />
          </EuiToolTip>
        );
      },
      width: '15%',
    },
    {
      field: 'traceId',
      name: i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappings.traceId', {
        defaultMessage: 'Trace ID',
      }),
      render: (hasMapping: boolean) => {
        return hasMapping ? (
          <EuiIcon type="check" color="success" />
        ) : (
          <EuiToolTip
            content={i18n.translate(
              'datasetManagement.correlatedDatasets.modal.fieldMappings.missingTooltip',
              {
                defaultMessage: 'Field mapping missing',
              }
            )}
          >
            <EuiIcon type="cross" color="danger" />
          </EuiToolTip>
        );
      },
      width: '15%',
    },
    {
      field: 'spanId',
      name: i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappings.spanId', {
        defaultMessage: 'Span ID',
      }),
      render: (hasMapping: boolean) => {
        return hasMapping ? (
          <EuiIcon type="check" color="success" />
        ) : (
          <EuiToolTip
            content={i18n.translate(
              'datasetManagement.correlatedDatasets.modal.fieldMappings.missingTooltip',
              {
                defaultMessage: 'Field mapping missing',
              }
            )}
          >
            <EuiIcon type="cross" color="danger" />
          </EuiToolTip>
        );
      },
      width: '15%',
    },
    {
      field: 'serviceName',
      name: i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappings.serviceName', {
        defaultMessage: 'Service name',
      }),
      render: (hasMapping: boolean) => {
        return hasMapping ? (
          <EuiIcon type="check" color="success" />
        ) : (
          <EuiToolTip
            content={i18n.translate(
              'datasetManagement.correlatedDatasets.modal.fieldMappings.missingTooltip',
              {
                defaultMessage: 'Field mapping missing',
              }
            )}
          >
            <EuiIcon type="cross" color="danger" />
          </EuiToolTip>
        );
      },
      width: '15%',
    },
  ];

  return (
    <EuiBasicTable
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      items={items}
      columns={columns}
      data-test-subj="fieldMappingsTable"
      tableLayout="fixed"
    />
  );
};
