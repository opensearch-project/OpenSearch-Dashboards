/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiPanel } from '@elastic/eui';
import React, { useState } from 'react';
import { DataViewField } from '../../../../data/public';
import { DiscoverField } from './discover_field';
import { DiscoverSidebarProps } from './discover_sidebar';
import { FieldDetails } from './types';

interface FieldGroupProps extends DiscoverSidebarProps {
  category: 'query' | 'discovered' | 'selected';
  title: string;
  fields: DataViewField[];
  getDetailsByField: (field: DataViewField) => FieldDetails;
  shortDotsEnabled: boolean;
}

export const FieldList = ({
  category,
  title,
  fields,
  columns,
  selectedDataSet,
  onAddField,
  onRemoveField,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FieldGroupProps) => {
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
        data-test-subj="dscSideBarFieldGroupButton"
        aria-label={title}
        isLoading={!!selectedDataSet.fieldsLoading}
      >
        {title}
      </EuiButtonEmpty>
      {expanded &&
        fields.map((field: DataViewField, index) => {
          return (
            <EuiPanel
              data-attr-field={field.name}
              key={field.name + index}
              paddingSize="none"
              hasBorder={false}
              hasShadow={false}
              color="transparent"
              className="exploreSideBar__item"
              data-test-subj={`fieldList-field`}
            >
              {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
              <DiscoverField
                selected={category === 'selected'}
                field={field}
                columns={columns}
                dataSet={selectedDataSet}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
                onAddFilter={onAddFilter}
                getDetails={getDetailsByField}
                useShortDots={shortDotsEnabled}
                showSummary={category !== 'discovered'}
              />
            </EuiPanel>
          );
        })}
    </EuiPanel>
  );
};
