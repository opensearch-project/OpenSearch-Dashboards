/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useEffect } from 'react';
import { EuiFlexItem, EuiAccordion, EuiSpacer, EuiNotificationBadge, EuiTitle } from '@elastic/eui';
import { WizardFieldSearch } from './wizard_field_search';

import {
  IndexPatternField,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
} from '../../../../../data/public';
import { FieldSelectorField } from './field_selector_field';

import './field_selector.scss';
import { useTypedSelector } from '../../utils/state_management';

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
  const indexFields = useTypedSelector((state) => state.dataSource.visualizableFields);
  const [filteredFields, setFilteredFields] = useState(indexFields);
  const [fieldSearchValue, setFieldSearchValue] = useState('');

  useEffect(() => {
    const filteredSubset = indexFields.filter((field) => {
      if (!field.displayName.includes(fieldSearchValue)) {
        return false;
      }

      return true;
    });

    setFilteredFields(filteredSubset);
    return;
  }, [indexFields, fieldSearchValue]);

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

  const onChangeFieldSearch = useCallback((field: string) => {
    setFieldSearchValue(field);
  }, []);

  return (
    <div className="wizFieldSelector">
      <div>
        <form>
          <WizardFieldSearch onChange={onChangeFieldSearch} value={fieldSearchValue} />
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
