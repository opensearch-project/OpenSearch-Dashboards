/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from 'elasticsearch';
import datemath from '@opensearch/datemath';
import {
  DATA_FRAME_TYPES,
  DataFrameAggConfig,
  IDataFrame,
  IDataFrameWithAggs,
  PartialDataFrame,
} from './types';
import { IFieldType } from './fields';
import { IndexPatternFieldMap, IndexPatternSpec } from '../index_patterns';
import { IOpenSearchDashboardsSearchRequest } from '../search';

export interface IDataFrameResponse extends SearchResponse<any> {
  type: DATA_FRAME_TYPES;
  body: IDataFrame | IDataFrameWithAggs;
  took: number;
}

export const getRawQueryString = (
  searchRequest: IOpenSearchDashboardsSearchRequest
): string | undefined => {
  return searchRequest.params?.body?.query?.queries[0]?.query;
};

export const getRawAggs = (searchRequest: IOpenSearchDashboardsSearchRequest) => {
  return searchRequest.params?.body?.aggs;
};

export const getAggConfig = (
  searchRequest: IOpenSearchDashboardsSearchRequest
): DataFrameAggConfig => {
  const rawAggs = getRawAggs(searchRequest);
  const aggConfig = {} as Partial<DataFrameAggConfig>;
  Object.entries(rawAggs).forEach(([aggKey, agg]) => {
    aggConfig.id = aggKey;
    Object.entries(agg as Record<string, unknown>).forEach(([name, value]) => {
      aggConfig.name = name;
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        if (k === 'field') {
          aggConfig.field = v as string;
        }
        if (k === 'fixed_interval') {
          aggConfig.interval = v as string;
        }
      });
    });
  });
  return aggConfig as DataFrameAggConfig;
};

export const convertResult = (response: IDataFrameResponse): SearchResponse<any> => {
  const data = response.body;
  const hits: any[] = [];
  for (let index = 0; index < data.size; index++) {
    const hit: { [key: string]: any } = {};
    data.fields.forEach((field) => {
      hit[field.name] = field.values[index];
    });
    hits.push({
      _index: data.name ?? '',
      _id: '',
      _source: hit,
    });
  }
  const searchResponse: SearchResponse<any> = {
    took: response.took,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    hits: {
      total: 0,
      max_score: 0,
      hits,
    },
  };

  if (data.hasOwnProperty('aggs')) {
    const dataWithAggs = data as IDataFrameWithAggs;
    if (!dataWithAggs.aggs) {
      // TODO: SQL best guess, get timestamp field and caculate it here
      return searchResponse;
    }
    searchResponse.aggregations = {
      'other-filter': {
        buckets: {
          doc_count: 0,
        },
      },
      2: {
        buckets: dataWithAggs.aggs.map((agg) => {
          searchResponse.hits.total += agg.value;
          return {
            key: new Date(agg.key).getTime(),
            key_as_string: agg.key,
            doc_count: agg.value,
          };
        }),
      },
    };
  }

  return searchResponse;
};

export const formatFieldValue = (field: IFieldType | Partial<IFieldType>, value: any): any => {
  return field.format && field.format.convert ? field.format.convert(value) : value;
};

export const getFieldType = (field: IFieldType | Partial<IFieldType>): string | undefined => {
  const fieldName = field.name?.toLowerCase();
  if (fieldName?.includes('date') || fieldName?.includes('timestamp')) {
    return 'date';
  }
  if (field.values?.some((value) => value instanceof Date || datemath.isDateTime(value))) {
    return 'date';
  }
  if (field.type === 'struct') {
    return 'object';
  }
  // if (field.type === 'string') {
  //   return 'keyword';
  // }

  return field.type;
};

export const getTimeField = (
  data: IDataFrame,
  aggConfig?: DataFrameAggConfig
): Partial<IFieldType> | undefined => {
  const fields = data.schema || data.fields;
  return aggConfig
    ? fields.find((field) => field.name === aggConfig.field)
    : fields.find((field) => field.type === 'date');
};

export const isGeoPoint = (value: any): boolean => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lon' in value &&
    typeof value.lat === 'number' &&
    typeof value.lon === 'number'
  );
};

export const createDataFrame = (partial: PartialDataFrame): IDataFrame | IDataFrameWithAggs => {
  let size = 0;
  const processField = (field: any) => {
    field.type = getFieldType(field);
    if (!field.values) {
      field.values = new Array(size);
    } else if (field.values.length > size) {
      size = field.values.length;
    }
    return field as IFieldType;
  };

  const schema = partial.schema?.map(processField);
  const fields = partial.fields.map(processField);

  return {
    ...partial,
    schema,
    fields,
    size,
  };
};

export const dataFrameToSpec = (dataFrame: IDataFrame, id?: string): IndexPatternSpec => {
  const fields = (dataFrame.schema || dataFrame.fields) as IFieldType[];

  const toFieldSpec = (field: IFieldType, overrides: Partial<IFieldType>) => {
    return {
      ...field,
      ...overrides,
      aggregatable: field.aggregatable ?? true,
      searchable: field.searchable ?? true,
    };
  };

  const flattenFields = (acc: IndexPatternFieldMap, field: IFieldType): any => {
    switch (field.type) {
      case 'object':
        const dataField = dataFrame.fields.find((f) => f.name === field.name) || field;
        if (dataField) {
          const subField = dataField.values[0];
          if (!subField) {
            acc[field.name] = toFieldSpec(field, {});
            break;
          }
          Object.entries(subField).forEach(([key, value]) => {
            const subFieldName = `${dataField.name}.${key}`;
            const subFieldType = typeof value;
            if (subFieldType === 'object' && isGeoPoint(value)) {
              acc[subFieldName] = toFieldSpec(subField, {
                name: subFieldName,
                type: 'geo_point',
              });
            } else {
              acc = flattenFields(acc, {
                name: subFieldName,
                type: subFieldType,
                values:
                  subFieldType === 'object'
                    ? Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
                        name: `${subFieldName}.${k}`,
                        type: typeof v,
                      }))
                    : [],
              } as IFieldType);
            }
          });
        }
        break;
      // case 'text':
      // case 'keyword':
      //   acc[field.name] = toFieldSpec(field, { type: 'string' });
      //   if (field.type === 'keyword') {
      //     acc[field.name].searchable = false;
      //     acc[`${field.name}.keyword`] = toFieldSpec(field, {
      //       name: `${field.name}.keyword`,
      //       type: 'string',
      //     });
      //   }
      //   break;
      default:
        acc[field.name] = toFieldSpec(field, {});
        break;
    }
    return acc;
  };

  return {
    id: id ?? DATA_FRAME_TYPES.DEFAULT,
    title: dataFrame.name,
    timeFieldName: getTimeField(dataFrame)?.name,
    type: !id ? DATA_FRAME_TYPES.DEFAULT : undefined,
    fields: fields.reduce(flattenFields, {} as IndexPatternFieldMap),
    // TODO: SQL dataSourceRef
  };
};
