/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldMappingError } from '../../../../../types/correlations';

interface ValidationCalloutProps {
  errors: FieldMappingError[];
}

export const ValidationCallout: React.FC<ValidationCalloutProps> = ({ errors }) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <EuiCallOut
      title={i18n.translate('datasetManagement.correlatedDatasets.modal.validationCalloutTitle', {
        defaultMessage: 'Missing field mappings in Logs datasets',
      })}
      color="danger"
      iconType="alert"
      data-test-subj="fieldMappingValidationCallout"
    >
      <EuiText size="s">
        <p>
          {i18n.translate(
            'datasetManagement.correlatedDatasets.modal.validationCalloutDescription',
            {
              defaultMessage:
                'The following datasets are missing required field mappings. Ensure the logs dataset contains primary fields: traceId, spanId, serviceName, and timestamp.',
            }
          )}
        </p>
        <ul>
          {errors.map((error) => (
            <li key={error.datasetId}>
              <strong>{error.datasetTitle}</strong>: {error.missingFields.join(', ')}
            </li>
          ))}
        </ul>
      </EuiText>
    </EuiCallOut>
  );
};
