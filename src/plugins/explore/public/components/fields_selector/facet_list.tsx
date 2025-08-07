/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiPanel } from '@elastic/eui';
import React, { useState } from 'react';
import { IndexPatternField } from '../../../../data/public';
import { DiscoverSidebarProps } from './discover_sidebar';
import { FacetField } from './facet_field';
import { FieldDetails } from './types';

interface FacetListProps extends DiscoverSidebarProps {
  title: string;
  fields: IndexPatternField[];
  getDetailsByField: (field: IndexPatternField) => FieldDetails;
  shortDotsEnabled: boolean;
}

export const FacetList = ({
  title,
  fields,
  selectedIndexPattern,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FacetListProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!selectedIndexPattern) return null;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="none">
      <EuiButtonEmpty
        iconSide="left"
        color="text"
        iconType={expanded ? 'arrowDown' : 'arrowRight'}
        onClick={() => setExpanded(!expanded)}
        size="xs"
        className="exploreSideBarFieldGroup"
        data-test-subj="exploreSideBarFieldGroupButton"
        aria-label={title}
        isLoading={!!selectedIndexPattern.fieldsLoading}
      >
        {title}
      </EuiButtonEmpty>
      {expanded &&
        fields.map((field: IndexPatternField, index) => {
          return (
            <FacetField
              key={field.name + index}
              field={field}
              getDetailsByField={getDetailsByField}
              shortDotsEnabled={shortDotsEnabled}
              onAddFilter={onAddFilter}
              selectedIndexPattern={selectedIndexPattern}
            />
          );
        })}
    </EuiPanel>
  );
};
