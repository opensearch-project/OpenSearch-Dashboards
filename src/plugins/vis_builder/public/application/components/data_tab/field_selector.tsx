/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EuiFlexItem, EuiDroppable } from '@elastic/eui';

import { IndexPattern, IndexPatternField, OSD_FIELD_TYPES } from '../../../../../data/public';

import { COUNT_FIELD } from '../../utils/drag_drop';
import { useTypedSelector } from '../../utils/state_management';
import { useIndexPatterns, useSampleHits } from '../../utils/use';
import { FieldSearch } from './field_search';
import { Field, DraggableFieldButton } from './field';
import { FieldDetails } from './types';
import { getAvailableFields, getDetails } from './utils';
import './field_selector.scss';
import { DraggableAccordion } from '../draggable_accordion';
import { FIELD_SELECTOR_ID } from './constants';

interface IFieldCategories {
  categorical: IndexPatternField[];
  numerical: IndexPatternField[];
  meta: IndexPatternField[];
}

export const FieldSelector = () => {
  const indexPattern = useIndexPatterns().selected;
  const fieldSearchValue = useTypedSelector((state) => state.visualization.searchField);
  // TODO: instead of a single fetch of sampled hits for all fields, we should just use the agg service to get top hits or terms per field: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2780
  const hits = useSampleHits();
  const [filteredFields, setFilteredFields] = useState<IndexPatternField[]>([]);

  useEffect(() => {
    const indexFields = indexPattern?.fields.getAll() ?? [];
    const filteredSubset = getAvailableFields(indexFields).filter((field) =>
      // case-insensitive field search
      field.displayName.toLowerCase().includes(fieldSearchValue.toLowerCase())
    );

    setFilteredFields(filteredSubset);
    return;
  }, [fieldSearchValue, indexPattern?.fields]);

  const fields = useMemo(
    () =>
      filteredFields?.reduce<IFieldCategories>(
        (fieldGroups, currentField) => {
          const category = getFieldCategory(currentField, indexPattern);
          fieldGroups[category].push(currentField);

          return fieldGroups;
        },
        {
          categorical: [],
          numerical: [],
          meta: [],
        }
      ),
    [filteredFields, indexPattern]
  );

  const getDetailsByField = useCallback(
    (ipField: IndexPatternField) => {
      return getDetails(ipField, hits, indexPattern);
    },
    [hits, indexPattern]
  );

  return (
    <div className="vbFieldSelector">
      <div>
        <form>
          <FieldSearch value={fieldSearchValue} />
        </form>
      </div>
      <div className="vbFieldSelector__fieldGroups">
        {/* Count Field */}
        <EuiDroppable
          className="vbFieldSelector__fieldGroup"
          droppableId={FIELD_SELECTOR_ID.COUNT}
          isDropDisabled={true}
          cloneDraggables={true}
        >
          <DraggableFieldButton
            field={{ name: 'count', displayName: 'Count', type: 'number' }}
            dragValue={COUNT_FIELD}
            // TODO: improve the test ID for the Count field (or use a non-conflicting `name` value) and update functional test accordingly: https://github.com/opensearch-project/opensearch-dashboards-functional-test/blob/6f4125c9823f8e54e138076737ca16f011cbd7e7/cypress/integration/core-opensearch-dashboards/opensearch-dashboards/apps/vis_builder/vis_types/metric.spec.js#L36
            dataTestSubj="field-undefined-showDetails"
            index={0}
          />
        </EuiDroppable>
        <EuiDroppable
          droppableId={FIELD_SELECTOR_ID.CATEGORICAL}
          isDropDisabled={true}
          className="vbFieldSelector__fieldGroup"
          cloneDraggables={true}
        >
          <FieldGroup
            id="categoricalFields"
            header="Categorical Fields"
            fields={fields?.categorical}
            getDetailsByField={getDetailsByField}
          />
        </EuiDroppable>
        <EuiDroppable
          droppableId={FIELD_SELECTOR_ID.NUMERICAL}
          isDropDisabled={true}
          className="vbFieldSelector__fieldGroup"
          cloneDraggables={true}
        >
          <FieldGroup
            id="numericalFields"
            header="Numerical Fields"
            fields={fields?.numerical}
            getDetailsByField={getDetailsByField}
          />
        </EuiDroppable>
        <EuiDroppable
          droppableId={FIELD_SELECTOR_ID.META}
          isDropDisabled={true}
          className="vbFieldSelector__fieldGroup"
          cloneDraggables={true}
        >
          <FieldGroup
            id="metaFields"
            header="Meta Fields"
            fields={fields?.meta}
            getDetailsByField={getDetailsByField}
          />
        </EuiDroppable>
      </div>
    </div>
  );
};

interface FieldGroupProps {
  fields?: IndexPatternField[];
  getDetailsByField: (ipField: IndexPatternField) => FieldDetails;
  header: string;
  id: string;
}

export const FieldGroup = ({ fields, header, id, getDetailsByField }: FieldGroupProps) => {
  return (
    <DraggableAccordion
      title={header}
      children={fields?.map((field, i) => (
        <EuiFlexItem key={i} grow={false}>
          <Field field={field} getDetails={getDetailsByField} id={i} />
        </EuiFlexItem>
      ))}
    />
  );
};

export const getFieldCategory = (
  { name, type }: IndexPatternField,
  indexPattern: IndexPattern | undefined
): keyof IFieldCategories => {
  const { metaFields = [] } = indexPattern ?? {};
  if (metaFields.includes(name)) return 'meta';
  if (type === OSD_FIELD_TYPES.NUMBER) return 'numerical';

  return 'categorical';
};
