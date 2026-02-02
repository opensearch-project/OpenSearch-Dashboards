/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiPanel } from '@elastic/eui';
import React, { useState } from 'react';
import { DataViewField } from '../../../../data/public';
import { DiscoverSidebarProps } from './discover_sidebar';
import { FacetField } from './facet_field';
import { FieldDetails } from './types';

interface FacetListProps extends DiscoverSidebarProps {
  title: string;
  fields: DataViewField[];
  getDetailsByField: (field: DataViewField) => FieldDetails;
  shortDotsEnabled: boolean;
}

export const FacetList = ({
  title,
  fields,
  selectedDataSet,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FacetListProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!selectedDataSet) return null;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="none">
      <EuiButtonEmpty
        iconSide="left"
        color="text"
        iconType={expanded ? 'arrowDown' : 'arrowRight'}
        onClick={() => setExpanded(!expanded)}
        size="xs"
        className="exploreSideBar_fieldGroup"
        data-test-subj="exploreSideBarFieldGroupButton"
        aria-label={title}
        isLoading={!!selectedDataSet.fieldsLoading}
      >
        {title}
      </EuiButtonEmpty>
      {expanded &&
        fields.map((field: DataViewField, index) => {
          return (
            <FacetField
              key={field.name + index}
              field={field}
              getDetailsByField={getDetailsByField}
              shortDotsEnabled={shortDotsEnabled}
              onAddFilter={onAddFilter}
              selectedDataSet={selectedDataSet}
            />
          );
        })}
    </EuiPanel>
  );
};
