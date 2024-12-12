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
  IDataFrameResponse,
  PartialDataFrame,
  DataFrameQueryConfig,
} from './types';
import { IFieldType } from './fields';
import { IndexPatternFieldMap, IndexPatternSpec } from '../index_patterns';
import { TimeRange } from '../types';

/**
 * Converts the data frame response to a search response.
 * This function is used to convert the data frame response to a search response
 * to be used by the rest of the application.
 *
 * @param response - data frame response object
 * @returns converted search response
 */
export const convertResult = (response: IDataFrameResponse): SearchResponse<any> => {
  const body = response.body;
  if (body.hasOwnProperty('error')) {
    return response;
  }
  const data = body as IDataFrame;
  const hits: any[] = [];
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
      hits: [],
    },
  };

  if (data && data.fields && data.fields.length > 0) {
    for (let index = 0; index < data.size; index++) {
      const hit: { [key: string]: any } = {};
      data.fields.forEach((field) => {
        hit[field.name] = field.values[index];
      });
      hits.push({
        _index: data.name,
        _source: hit,
      });
    }
  }
  searchResponse.hits.hits = hits;

  if (data.hasOwnProperty('aggs')) {
    const dataWithAggs = data as IDataFrameWithAggs;
    if (!dataWithAggs.aggs) {
      return searchResponse;
    }
    searchResponse.aggregations = {};

    const aggConfig = dataWithAggs.meta;
    Object.entries(dataWithAggs.aggs).forEach(([id, value]) => {
      if (aggConfig && aggConfig.date_histogram) {
        const buckets = value as Array<{ key: string; value: number }>;
        searchResponse.aggregations[id] = {
          buckets: buckets.map((bucket) => {
            const timestamp = new Date(bucket.key).getTime();
            searchResponse.hits.total += bucket.value;
            return {
              key_as_string: bucket.key,
              key: timestamp,
              doc_count: bucket.value,
            };
          }),
        };
      } else {
        // Handle other aggregation types here if needed
        searchResponse.aggregations[id] = value;
      }
    });
  }

  return searchResponse;
};

/**
 * Returns the field type. This function is used to determine the field type so that can
 * be used by the rest of the application. The field type must map to a OsdFieldType
 * to be used by the rest of the application.
 *
 * @param field - field object
 * @returns field type
 */
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

  return field.type;
};

/**
 * Returns the time field. If there is an aggConfig then we do not have to guess.
 * If there is no aggConfig then we will try to guess the time field.
 *
 * @param data - data frame object.
 * @param aggConfig - aggregation configuration object.
 * @returns time field.
 */
export const getTimeField = (
  data: IDataFrame,
  queryConfig?: DataFrameQueryConfig,
  aggConfig?: DataFrameAggConfig
): Partial<IFieldType> | undefined => {
  if (queryConfig?.timeFieldName) {
    return {
      name: queryConfig.timeFieldName,
      type: 'date',
    };
  }
  const fields = data.schema || data.fields;
  if (!fields) {
    throw Error('Invalid time field');
  }
  return aggConfig && aggConfig.date_histogram && aggConfig.date_histogram.field
    ? fields.find((field) => field.name === aggConfig?.date_histogram?.field)
    : fields.find((field) => field.type === 'date');
};

/**
 * Parses timepicker datetimes using datemath package. Will attempt to parse strings such as
 * "now - 15m"
 *
 * @param dateRange - of type TimeRange
 * @param dateFormat - formatting string (should work with Moment)
 * @returns object with `fromDate` and `toDate` strings, both of which will be in utc time and formatted to
 * the `dateFormat` parameter
 */
export const formatTimePickerDate = (dateRange: TimeRange, dateFormat: string) => {
  const dateMathParse = (date: string, roundUp?: boolean) => {
    const parsedDate = datemath.parse(date, { roundUp });
    return parsedDate ? parsedDate.utc().format(dateFormat) : '';
  };

  const fromDate = dateMathParse(dateRange.from);
  const toDate = dateMathParse(dateRange.to, true);

  return { fromDate, toDate };
};

/**
 * Checks if the value is a GeoPoint. Expects an object with lat and lon properties.
 *
 * @param value - value to check
 * @returns True if the value is a GeoPoint, false otherwise
 */
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

/**
 * Creates a data frame.
 *
 * @param partial - partial data frame object
 * @returns data frame.
 */
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
  const fields = partial.fields?.map(processField);

  return {
    ...partial,
    schema,
    fields,
    size,
  };
};

/**
 * Converts a data frame to index pattern spec which can be used to create an index pattern.
 *
 * @param dataFrame - data frame object
 * @param id - index pattern id if it exists
 * @returns index pattern spec
 */
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
                    ? Object.entries(value as Record<string, unknown>)?.map(([k, v]) => ({
                        name: `${subFieldName}.${k}`,
                        type: typeof v,
                      }))
                    : [],
              } as IFieldType);
            }
          });
        }
        break;
      default:
        acc[field.name] = toFieldSpec(field, {});
        break;
    }
    return acc;
  };

  return {
    id: id ?? DATA_FRAME_TYPES.DEFAULT,
    title: dataFrame.name,
    timeFieldName: getTimeField(dataFrame, dataFrame.meta?.queryConfig)?.name,
    dataSourceRef: {
      id: dataFrame.meta?.queryConfig?.dataSourceId,
      name: dataFrame.meta?.queryConfig?.dataSourceName,
      type: dataFrame.meta?.queryConfig?.dataSourceType,
    },
    type: !id ? DATA_FRAME_TYPES.DEFAULT : undefined,
    fields: fields.reduce(flattenFields, {} as IndexPatternFieldMap),
  };
};
