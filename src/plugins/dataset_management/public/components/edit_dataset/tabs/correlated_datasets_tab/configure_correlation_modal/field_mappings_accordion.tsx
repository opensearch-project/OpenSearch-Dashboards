/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiAccordion, EuiSpacer, EuiText, EuiIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldMappingError } from '../../../../../types/correlations';
import { FieldMappingsTable } from './field_mappings_table';

interface FieldMappingsAccordionProps {
  errors: FieldMappingError[];
  isValid: boolean;
}

export const FieldMappingsAccordion: React.FC<FieldMappingsAccordionProps> = ({
  errors,
  isValid,
}) => {
  const buttonContent = (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        {isValid ? (
          <EuiIcon type="check" color="success" />
        ) : (
          <EuiIcon type="alert" color="danger" />
        )}
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText size="s">
          <strong>
            {i18n.translate(
              'datasetManagement.correlatedDatasets.modal.fieldMappingsAccordionTitle',
              {
                defaultMessage: 'View dataset field mappings',
              }
            )}
          </strong>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiAccordion
      id="fieldMappingsAccordion"
      buttonContent={buttonContent}
      initialIsOpen={!isValid}
      data-test-subj="fieldMappingsAccordion"
    >
      <EuiSpacer size="m" />
      {errors.length > 0 ? (
        <>
          <EuiText size="s" color="subdued">
            <p>
              {i18n.translate(
                'datasetManagement.correlatedDatasets.modal.fieldMappingsDescription',
                {
                  defaultMessage:
                    'The following table shows the field mapping status for each logs dataset. All required fields must be mapped before you can save the correlation.',
                }
              )}
            </p>
          </EuiText>
          <EuiSpacer size="m" />
          <FieldMappingsTable errors={errors} />
        </>
      ) : (
        <EuiText size="s" color="success">
          <p>
            {i18n.translate('datasetManagement.correlatedDatasets.modal.fieldMappingsAllValid', {
              defaultMessage: 'All logs datasets are ready for correlation',
            })}
          </p>
        </EuiText>
      )}
    </EuiAccordion>
  );
};
