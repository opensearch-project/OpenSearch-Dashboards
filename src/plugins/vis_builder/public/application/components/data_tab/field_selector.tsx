/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { EuiFlexItem, EuiAccordion, EuiNotificationBadge, EuiTitle } from '@elastic/eui';

import {
  FilterManager,
  IndexPattern,
  IndexPatternField,
  OPENSEARCH_FIELD_TYPES,
  OSD_FIELD_TYPES,
  SortDirection,
} from '../../../../../data/public';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

import { VisBuilderServices } from '../../../types';
import { COUNT_FIELD } from '../../utils/drag_drop';
import { useTypedSelector } from '../../utils/state_management';
import { useIndexPatterns } from '../../utils/use';
import { FieldSearch } from './field_search';
import { Field, DraggableFieldButton } from './field';
import { FieldDetails } from './types';
import { getAvailableFields, getDetails } from './utils';
import './field_selector.scss';

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
  const {
    services: {
      data: {
        query: {
          filterManager,
          queryString,
          state$,
          timefilter: { timefilter },
        },
        search: { searchSource },
      },
      uiSettings: config,
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const indexPattern = useIndexPatterns().selected;
  const fieldSearchValue = useTypedSelector((state) => state.visualization.searchField);
  const [filteredFields, setFilteredFields] = useState<IndexPatternField[]>([]);
  const [hits, setHits] = useState<Array<Record<string, any>>>([]);
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
  });

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

  useEffect(() => {
    async function getData() {
      if (indexPattern && searchContext) {
        const newSearchSource = await searchSource.create();
        const timeRangeFilter = timefilter.createFilter(indexPattern);

        newSearchSource
          .setField('index', indexPattern)
          .setField('size', config.get('discover:sampleSize') ?? 500)
          .setField('sort', [{ [indexPattern.timeFieldName || '_score']: 'desc' as SortDirection }])
          .setField('filter', [
            ...(searchContext.filters ?? []),
            ...(timeRangeFilter ? [timeRangeFilter] : []),
          ]);

        if (searchContext.query) {
          const contextQuery =
            searchContext.query instanceof Array ? searchContext.query[0] : searchContext.query;

          newSearchSource.setField('query', contextQuery);
        }

        const searchResponse = await newSearchSource.fetch();

        setHits(searchResponse.hits.hits);
      }
    }

    getData();
  }, [config, searchContext, searchSource, indexPattern, timefilter]);

  useLayoutEffect(() => {
    const subscription = state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [state$]);

  const getDetailsByField = useCallback(
    (ipField: IndexPatternField) => {
      return getDetails(ipField, hits, indexPattern);
    },
    [hits, indexPattern]
  );

  const commonFieldGroupProps = {
    filterManager,
    indexPattern,
    getDetails: getDetailsByField,
  };

  return (
    <div className="vbFieldSelector">
      <div>
        <form>
          <FieldSearch value={fieldSearchValue} />
        </form>
      </div>
      <div className="vbFieldSelector__fieldGroups">
        {/* Count Field */}
        <DraggableFieldButton
          field={{ name: 'count', displayName: 'Count', type: 'number' }}
          dragValue={COUNT_FIELD}
        />
        <FieldGroup
          id="categoricalFields"
          header="Categorical Fields"
          fields={fields?.categorical}
          {...commonFieldGroupProps}
        />
        <FieldGroup
          id="numericalFields"
          header="Numerical Fields"
          fields={fields?.numerical}
          {...commonFieldGroupProps}
        />
        <FieldGroup
          id="metaFields"
          header="Meta Fields"
          fields={fields?.meta}
          {...commonFieldGroupProps}
        />
      </div>
    </div>
  );
};

interface FieldGroupProps {
  fields?: IndexPatternField[];
  filterManager: FilterManager;
  getDetails: (ipField: IndexPatternField) => FieldDetails;
  header: string;
  id: string;
  indexPattern?: IndexPattern;
}

export const FieldGroup = ({ fields, header, id, ...rest }: FieldGroupProps) => {
  return (
    <EuiAccordion
      id={id}
      className="vbFieldSelector__fieldGroup"
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
          <Field field={field} {...rest} />
        </EuiFlexItem>
      ))}
    </EuiAccordion>
  );
};

export const getFieldCategory = ({ name, type }: IndexPatternField): keyof IFieldCategories => {
  if (META_FIELDS.includes(name)) return 'meta';
  if (type === OSD_FIELD_TYPES.NUMBER) return 'numerical';

  return 'categorical';
};
