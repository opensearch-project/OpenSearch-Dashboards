/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { EuiFlexItem, EuiAccordion, EuiSpacer, EuiNotificationBadge, EuiTitle } from '@elastic/eui';
import { FieldSearch } from './field_search';
import {
  IndexPatternField,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
} from '../../../../../data/public';
import { FieldSelectorField } from './field_selector_field';

import './field_selector.scss';
import { useTypedSelector } from '../../utils/state_management';
import { getDetails } from './lib/get_details';

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
  const fieldSearchValue = useTypedSelector((state) => state.dataSource.searchField);

  useEffect(() => {
    const filteredSubset = indexFields.filter((field) =>
      field.displayName.includes(fieldSearchValue)
    );

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

  return (
    <div className="wizFieldSelector">
      <div>
        <form>
          <FieldSearch value={fieldSearchValue} />
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

const FieldGroup = ({ fields, header, id }: FieldGroupProps) => {
  const indexPattern = useTypedSelector((state) => state.dataSource.indexPattern);

  const hits: Array<Record<string, any>> = [];
  const columns: string[] = [];
  const getDetailsByField = useCallback(
    (ipField: IndexPatternField) => getDetails(ipField, hits, columns, indexPattern),
    [columns, hits, indexPattern]
  );

  return (
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
            <FieldSelectorField
              field={field}
              indexPattern={indexPattern}
              getDetails={getDetailsByField}
            />
          </EuiFlexItem>
        ))}
      </EuiAccordion>
      <EuiSpacer size="s" />
    </>
  );
};

function getFieldCategory(field: IndexPatternField): keyof IFieldCategories {
  if (META_FIELDS.includes(field.name)) return 'meta';
  if (field.type === OSD_FIELD_TYPES.NUMBER) return 'numerical';

  return 'categorical';
}
