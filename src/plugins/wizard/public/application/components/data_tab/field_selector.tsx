/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { EuiFlexItem, EuiAccordion, EuiNotificationBadge, EuiTitle } from '@elastic/eui';
import { FieldSearch } from './field_search';

import {
  IndexPatternField,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
} from '../../../../../data/public';
import { FieldSelectorField } from './field_selector_field';

import './field_selector.scss';
import { useTypedSelector } from '../../utils/state_management';
import { useIndexPatterns } from '../../utils/use';
import { getAvailableFields } from './utils';

interface IFieldCategories {
  categorical: IndexPatternField[];
  numerical: IndexPatternField[];
  meta: IndexPatternField[];
}

const META_FIELDS: string[] = [
  OPENSEARCH_FIELD_TYPES._ID,
  OPENSEARCH_FIELD_TYPES._INDEX,
  OPENSEARCH_FIELD_TYPES._SOURCE,
  OPENSEARCH_FIELD_TYPES._TYPE,
];

export const FieldSelector = () => {
  const indexPattern = useIndexPatterns().selected;
  const fieldSearchValue = useTypedSelector((state) => state.visualization.searchField);
  const [filteredFields, setFilteredFields] = useState<IndexPatternField[]>([]);

  useEffect(() => {
    const indexFields = indexPattern?.fields ?? [];
    const filteredSubset = getAvailableFields(indexFields).filter((field) =>
      field.displayName.includes(fieldSearchValue)
    );

    setFilteredFields(filteredSubset);
    return;
  }, [fieldSearchValue, indexPattern?.fields]);

  const fields = useMemo(
    () =>
      filteredFields?.reduce<IFieldCategories>(
        (fieldGroups, currentField) => {
          const category = getFieldCategory(currentField);
          fieldGroups[category].push(currentField);

          return fieldGroups;
        },
        {
          categorical: [],
          numerical: [],
          meta: [],
        }
      ),
    [filteredFields]
  );

  return (
    <div className="wizFieldSelector">
      <div>
        <form>
          <FieldSearch value={fieldSearchValue} />
        </form>
      </div>
      <div className="wizFieldSelector__fieldGroups">
        {/* Count Field */}
        <FieldSelectorField
          field={{
            displayName: 'Count',
            scripted: false,
            type: 'number',
          }}
        />
        <FieldGroup
          id="categoricalFields"
          header="Categorical Fields"
          fields={fields?.categorical}
        />
        <FieldGroup id="numericalFields" header="Numerical Fields" fields={fields?.numerical} />
        <FieldGroup id="metaFields" header="Meta Fields" fields={fields?.meta} />
      </div>
    </div>
  );
};

interface FieldGroupProps {
  fields?: IndexPatternField[];
  header: string;
  id: string;
}

const FieldGroup = ({ fields, header, id }: FieldGroupProps) => (
  <EuiAccordion
    id={id}
    className="wizFieldSelector__fieldGroup"
    buttonContent={
      <EuiTitle size="xxxs">
        <span>{header}</span>
      </EuiTitle>
    }
    extraAction={
      <EuiNotificationBadge color="subdued" size="m">
        {fields?.length || 0}
      </EuiNotificationBadge>
    }
    initialIsOpen
  >
    {fields?.map((field, i) => (
      <EuiFlexItem key={i}>
        <FieldSelectorField field={field} />
      </EuiFlexItem>
    ))}
  </EuiAccordion>
);

function getFieldCategory(field: IndexPatternField): keyof IFieldCategories {
  if (META_FIELDS.includes(field.name)) return 'meta';
  if (field.type === OSD_FIELD_TYPES.NUMBER) return 'numerical';

  return 'categorical';
}
