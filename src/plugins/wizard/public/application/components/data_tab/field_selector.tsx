/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { EuiFlexItem, EuiAccordion, EuiSpacer, EuiNotificationBadge, EuiTitle } from '@elastic/eui';
import { getDefaultFieldFilter, setFieldFilterProp } from './lib/field_filter';
import { WizardFieldSearch } from './wizard_field_search';

import {
  IndexPatternField,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
} from '../../../../../data/public';
import { FieldSelectorField } from './field_selector_field';

import './field_selector.scss';

interface FieldSelectorDeps {
  indexFields: IndexPatternField[];
}

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

export const FieldSelector = ({ indexFields }: FieldSelectorDeps) => {
  const [fieldFilterState, setFieldFilterState] = useState(getDefaultFieldFilter());
  const [filteredFields, setFilteredFields] = useState(indexFields);

  useEffect(() => {
    const filteredSubset = indexFields.filter((field) => {
      if (!field.displayName.includes(fieldFilterState.name)) {
        return false;
      }

      // Other conditions

      return true;
    });

    setFilteredFields(filteredSubset);
    return;
  }, [indexFields, fieldFilterState]);

  const fields = filteredFields?.reduce<IFieldCategories>(
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
  );

  const onChangeFieldSearch = useCallback(
    (field: string, value: string | boolean | undefined) => {
      const newState = setFieldFilterProp(fieldFilterState, field, value);
      setFieldFilterState(newState);
    },
    [fieldFilterState]
  );

  const fieldTypes = useMemo(() => {
    const result = ['any'];
    if (Array.isArray(fields)) {
      for (const field of fields) {
        if (result.indexOf(field.type) === -1) {
          result.push(field.type);
        }
      }
    }
    return result;
  }, [fields]);

  return (
    <div className="wizFieldSelector">
      <div>
        <form>
          <WizardFieldSearc
            onChange={onChangeFieldSearch}
            value={fieldFilterState.name}
            types={fieldTypes}
          />
        </form>
      </div>
      <div className="wizFieldSelector__fieldGroups">
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
  <>
    <EuiAccordion
      id={id}
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
    <EuiSpacer size="s" />
  </>
);

function getFieldCategory(field: IndexPatternField): keyof IFieldCategories {
  if (META_FIELDS.includes(field.name)) return 'meta';
  if (field.type === OSD_FIELD_TYPES.NUMBER) return 'numerical';

  return 'categorical';
}
