/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiText } from '@elastic/eui';
import React, { useState } from 'react';
import { DataViewField, DataView } from '../../../../data/public';
import { Bucket, FieldDetails } from './types';
import { FieldIcon } from '../../../../opensearch_dashboards_react/public';
import { FacetValue } from './facet_value';
import { getFieldTypeName } from './lib/get_field_type_name';

interface FacetFieldProps {
  field: DataViewField;
  selectedDataSet?: DataView;
  onAddFilter: (field: DataViewField | string, value: string, type: '+' | '-') => void;
  getDetailsByField: (field: DataViewField) => FieldDetails;
  shortDotsEnabled: boolean;
}

export const FacetField = ({
  field,
  selectedDataSet,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FacetFieldProps) => {
  const [expanded, setExpanded] = useState(true);
  const { buckets } = getDetailsByField(field);

  if (!selectedDataSet || buckets.length === 0) return null;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="none">
      <EuiButtonEmpty
        iconSide="left"
        color="text"
        iconType={expanded ? 'arrowDown' : 'arrowRight'}
        onClick={() => setExpanded(!expanded)}
        size="xs"
        className="exploreSideBar__facetField"
        data-test-subj="exploreSideBarFacetFieldButton"
        aria-label={field.name}
        isLoading={!!selectedDataSet.fieldsLoading}
      >
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          responsive={false}
          data-test-subj="exploreSidebarField"
        >
          <EuiFlexItem grow={false}>
            <FieldIcon
              type={field.type}
              label={getFieldTypeName(field.type)}
              scripted={field.scripted}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs">{field.name}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiButtonEmpty>
      {expanded &&
        buckets.map((bucket: Bucket, index) => {
          return (
            <EuiPanel
              data-attr-field={field.name}
              key={field.name + index}
              paddingSize="none"
              hasBorder={false}
              hasShadow={false}
              color="transparent"
              className="exploreSideBar__facetValue"
              data-test-subj={`facetField-value`}
            >
              {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
              <FacetValue
                field={field}
                onAddFilter={onAddFilter}
                useShortDots={shortDotsEnabled}
                bucket={bucket}
              />
            </EuiPanel>
          );
        })}
    </EuiPanel>
  );
};
