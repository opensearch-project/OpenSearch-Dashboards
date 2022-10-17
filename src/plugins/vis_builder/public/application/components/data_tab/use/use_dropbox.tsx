/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { BucketAggType, IndexPatternField, propFilter } from '../../../../../../data/common';
import { Schema } from '../../../../../../vis_default_editor/public';
import { COUNT_FIELD, FieldDragDataType } from '../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../utils/state_management';
import { DropboxDisplay, DropboxProps } from '../dropbox';
import { useDrop } from '../../../utils/drag_drop';
import {
  editDraftAgg,
  reorderAgg,
  updateAggConfigParams,
} from '../../../utils/state_management/visualization_slice';
import { useIndexPatterns } from '../../../utils/use/use_index_pattern';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../../../types';

const filterByName = propFilter('name');
const filterByType = propFilter('type');

export interface UseDropboxProps extends Pick<DropboxProps, 'id' | 'label'> {
  schema: Schema;
}

export const useDropbox = (props: UseDropboxProps): DropboxProps => {
  const { id: dropboxId, label, schema } = props;
  const [validAggTypes, setValidAggTypes] = useState<string[]>([]);
  const dispatch = useTypedDispatch();
  const indexPattern = useIndexPatterns().selected;
  const {
    services: {
      data: {
        search: { aggs: aggService },
      },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const aggConfigParams = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams
  );

  const aggConfigs = useMemo(() => {
    return indexPattern && aggService.createAggConfigs(indexPattern, cloneDeep(aggConfigParams));
  }, [aggConfigParams, aggService, indexPattern]);

  const aggs = useMemo(() => aggConfigs?.aggs ?? [], [aggConfigs?.aggs]);

  const dropboxAggs = aggs.filter((agg) => agg.schema === schema.name);

  const displayFields: DropboxDisplay[] = useMemo(
    () =>
      dropboxAggs?.map(
        (agg): DropboxDisplay => ({
          id: agg.id,
          label: agg.makeLabel(),
        })
      ) || [],
    [dropboxAggs]
  );

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    if (!aggConfigs || !indexPattern) {
      throw new Error('Cannot create new field, missing aggConfigs or indexPattern');
    }

    const aggConfig = aggConfigs.createAggConfig(
      {
        schema: schema.name,
        // using any since createAggConfig requires the type property but when an agg is brandNew, this has to be skipped.
        // TODO: Update createAggConfig typing to correctly handle missing type field
      } as any,
      {
        addToAggConfigs: false,
      }
    );

    aggConfig.brandNew = true;
    const newAggs = [...aggs, aggConfig];
    const newAggConfigs = aggService.createAggConfigs(indexPattern, cloneDeep(newAggs));
    const newAggConfig = newAggConfigs.aggs.find((agg) => agg.brandNew);

    if (!newAggConfig) {
      throw new Error('Missing new aggConfig');
    }

    dispatch(editDraftAgg(newAggConfig.serialize()));
  }, [aggConfigs, aggService, aggs, dispatch, indexPattern, schema.name]);

  const onEditField = useCallback(
    (aggId: string) => {
      const aggConfig = aggConfigs?.aggs.find((agg) => agg.id === aggId);

      if (!aggConfig) {
        throw new Error('Could not find agg in aggConfigs');
      }

      dispatch(editDraftAgg(aggConfig.serialize()));
    },
    [aggConfigs?.aggs, dispatch]
  );

  const onDeleteField = useCallback(
    (aggId: string) => {
      const newAggs = aggConfigs?.aggs.filter((agg) => agg.id !== aggId);

      if (newAggs) {
        dispatch(updateAggConfigParams(newAggs.map((agg) => agg.serialize())));
      }
    },
    [aggConfigs?.aggs, dispatch]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data || !validAggTypes.length) return;

      const fieldName = data;
      const schemaAggTypes = (schema.defaults as any).aggTypes;
      const allowedAggTypes = schemaAggTypes
        ? schemaAggTypes.filter((type: string) => validAggTypes.includes(type))
        : [];

      aggConfigs?.createAggConfig({
        type: allowedAggTypes[0] || validAggTypes[0],
        schema: schema.name,
        params: {
          field: fieldName,
        },
      });

      if (aggConfigs) {
        dispatch(updateAggConfigParams(aggConfigs.aggs.map((agg) => agg.serialize())));
      }
    },
    [aggConfigs, dispatch, schema.defaults, schema.name, validAggTypes]
  );

  const onReorderField = useCallback(
    ({ sourceAggId, destinationAggId }) => {
      dispatch(
        reorderAgg({
          sourceId: sourceAggId,
          destinationId: destinationAggId,
        })
      );
    },
    [dispatch]
  );

  const [dropProps, { isValidDropTarget, dragData, ...dropState }] = useDrop(
    'field-data',
    onDropField
  );

  useEffect(() => {
    const getValidAggTypes = () => {
      if (!dragData || schema.group === 'none') return [];
      const isCountField = dragData === COUNT_FIELD;

      const indexField = isCountField
        ? { type: 'count' }
        : getIndexPatternField(dragData, indexPattern?.fields ?? []);

      if (!indexField) return [];

      // Get all aggTypes allowed by the schema and get a list of all the aggTypes that the dragged index field can use
      const aggTypes = aggService.types.getAll();
      // `types` can be either a Bucket or Metric aggType, but both types have the name property.
      const allowedAggTypes = filterByName(
        aggTypes[schema.group] as BucketAggType[],
        schema.aggFilter
      );

      return (
        allowedAggTypes
          .filter((aggType) => {
            const allowedFieldTypes = aggType.paramByName('field')?.filterFieldTypes;
            return filterByType([indexField], allowedFieldTypes).length !== 0;
          })
          .filter((aggType) => (isCountField ? true : aggType.name !== 'count'))
          // `types` can be either a Bucket or Metric aggType, but both types have the name property.
          .map((aggType) => (aggType as BucketAggType).name)
      );
    };

    setValidAggTypes(getValidAggTypes());

    return () => {
      setValidAggTypes([]);
    };
  }, [aggService.types, dragData, indexPattern?.fields, schema.aggFilter, schema.group]);

  const canDrop = validAggTypes.length > 0 && schema.max > dropboxAggs.length;

  return {
    id: dropboxId,
    label,
    limit: schema.max,
    fields: displayFields,
    onAddField,
    onEditField,
    onDeleteField,
    onReorderField,
    ...dropState,
    dragData,
    isValidDropTarget: canDrop,
    dropProps,
  };
};

const getIndexPatternField = (indexFieldName: string, availableFields: IndexPatternField[]) =>
  availableFields.find(({ name }) => name === indexFieldName);
