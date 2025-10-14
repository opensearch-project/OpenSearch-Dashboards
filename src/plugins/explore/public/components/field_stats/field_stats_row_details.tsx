/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiCallOut,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, FieldDetails } from './utils/field_stats_types';
import { getApplicableSections } from './utils/field_stats_utils';

interface FieldStatsRowDetailsProps {
  field?: FieldStatsItem;
  details: FieldDetails;
  isLoading?: boolean;
}

export const FieldStatsRowDetails: React.FC<FieldStatsRowDetailsProps> = ({
  field,
  details,
  isLoading,
}) => {
  if (!field) {
    return (
      <EuiCallOut
        color="warning"
        title={i18n.translate('explore.fieldStats.rowDetails.fieldInfoNotAvailable', {
          defaultMessage: 'Field information not available',
        })}
      />
    );
  }

  if (isLoading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ padding: '2rem' }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="m" />
          <EuiSpacer size="s" />
          <span>
            {i18n.translate('explore.fieldStats.rowDetails.loadingDetails', {
              defaultMessage: 'Loading details...',
            })}
          </span>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (details?.error) {
    return (
      <EuiCallOut
        color="danger"
        title={i18n.translate('explore.fieldStats.rowDetails.failedToLoadDetails', {
          defaultMessage: 'Failed to load details',
        })}
      />
    );
  }

  // Get applicable sections for this field type
  const fieldType = field.type.toLowerCase();
  const applicableSections = getApplicableSections(fieldType);

  if (applicableSections.length === 0) {
    return (
      <EuiCallOut
        title={i18n.translate('explore.fieldStats.rowDetails.noApplicableSections', {
          defaultMessage: 'No details available for this field type',
        })}
        iconType="iInCircle"
      />
    );
  }

  // Check if we have any data to display
  const hasAnyData = applicableSections.some((section) => {
    const sectionData = (details as any)[section.id];
    return (
      sectionData && !sectionData.error && (!Array.isArray(sectionData) || sectionData.length > 0)
    );
  });

  if (!hasAnyData) {
    return (
      <EuiCallOut
        title={i18n.translate('explore.fieldStats.rowDetails.noDetailsAvailable', {
          defaultMessage: 'No details available',
        })}
        iconType="iInCircle"
      >
        {i18n.translate('explore.fieldStats.rowDetails.noDetailsAvailableDescription', {
          defaultMessage: 'Details could not be retrieved for this field.',
        })}
      </EuiCallOut>
    );
  }

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="m"
      data-test-subj={`fieldStatsRowDetails-${field.name}`}
    >
      {applicableSections.map((section) => {
        const sectionData = (details as any)[section.id];

        // Skip if no data or error
        if (!sectionData || sectionData.error) {
          return null;
        }

        // Skip empty arrays
        if (Array.isArray(sectionData) && sectionData.length === 0) {
          return null;
        }

        const SectionComponent = section.component;

        return (
          <EuiFlexItem key={section.id}>
            <EuiPanel paddingSize="s">
              <EuiTitle size="xs">
                <h4>{section.title}</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <SectionComponent data={sectionData} field={field} />
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};
