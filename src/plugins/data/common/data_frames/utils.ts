/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from 'elasticsearch';
import datemath from '@opensearch/datemath';
import {
  DATA_FRAME_TYPES,
  DataFrameAggConfig,
  DataFrameBucketAgg,
  IDataFrame,
  IDataFrameWithAggs,
  IDataFrameResponse,
  PartialDataFrame,
  DataFrameQueryConfig,
} from './types';
import { IFieldType } from './fields';
import { IndexPatternFieldMap, IndexPatternSpec } from '../index_patterns';
import { IOpenSearchDashboardsSearchRequest } from '../search';
import { GetAggTypeFn, GetDataFrameAggQsFn, Query, TimeRange } from '../types';

/**
 * Returns the raw data frame from the search request.
 *
 * @param searchRequest - search request object.
 * @returns dataframe
 */
export const getRawDataFrame = (searchRequest: IOpenSearchDashboardsSearchRequest) => {
  return searchRequest.params?.body?.df;
};

/**
 * Returns the raw query string from the search request.
 * Gets current state query if exists, otherwise gets the initial query.
 *
 * @param searchRequest - search request object
 * @returns query string
 */
export const getRawQueryString = (
  searchRequest: IOpenSearchDashboardsSearchRequest
): string | undefined => {
  return (
    searchRequest.params?.body?.query?.queries[1]?.query ??
    searchRequest.params?.body?.query?.queries[0]?.query
  );
};

/**
 * Returns the raw aggregations from the search request.
 *
 * @param searchRequest - search request object
 * @returns aggregations
 */
export const getRawAggs = (searchRequest: IOpenSearchDashboardsSearchRequest) => {
  return searchRequest.params?.body?.aggs;
};

/**
 * Returns the unique values for raw aggregations. This is used
 * with `other-filter` aggregation. To get the values that were not
 * included in the aggregation response prior to this request.
 *
 * @param rawAggs - raw aggregations object
 * @returns object containing the field and its unique values
 */
export const getUniqueValuesForRawAggs = (rawAggs: Record<string, any>) => {
  const filters = rawAggs.filters?.filters?.['']?.bool?.must_not;
  if (!filters || !Array.isArray(filters)) {
    return null;
  }
  const values: unknown[] = [];
  let field: string | undefined;

  filters.forEach((agg: any) => {
    Object.values(agg).forEach((aggValue) => {
      Object.entries(aggValue as Record<string, any>).forEach(([key, value]) => {
        field = key;
        values.push(value);
      });
    });
  });

  return { field, values };
};

/**
 * Returns the aggregation configuration for raw aggregations.
 * Aggregations are nested objects, so this function recursively
 * builds an object that is easier to work with.
 *
 * @param rawAggs - raw aggregations object
 * @returns aggregation configuration
 */
export const getAggConfigForRawAggs = (rawAggs: Record<string, any>): DataFrameAggConfig | null => {
  const aggConfig: DataFrameAggConfig = { id: '', type: '' };

  Object.entries(rawAggs).forEach(([aggKey, agg]) => {
    aggConfig.id = aggKey;
    Object.entries(agg as Record<string, unknown>).forEach(([name, value]) => {
      if (name === 'aggs') {
        aggConfig.aggs = {};
        Object.entries(value as Record<string, unknown>).forEach(([subAggKey, subRawAgg]) => {
          const subAgg = getAggConfigForRawAggs(subRawAgg as Record<string, any>);
          if (subAgg) {
            aggConfig.aggs![subAgg.id] = { ...subAgg, id: subAggKey };
          }
        });
      } else {
        aggConfig.type = name;
        Object.assign(aggConfig, { [name]: value });
      }
    });
  });

  return aggConfig;
};

/**
 * Returns the aggregation configuration.
 *
 * @param searchRequest - search request object
 * @param aggConfig - aggregation configuration object
 * @param getAggTypeFn - function to get the aggregation type from the aggsService
 * @returns aggregation configuration
 */
export const getAggConfig = (
  searchRequest: IOpenSearchDashboardsSearchRequest,
  aggConfig: Partial<DataFrameAggConfig> = {},
  getAggTypeFn: GetAggTypeFn
): DataFrameAggConfig => {
  const rawAggs = getRawAggs(searchRequest);
  Object.entries(rawAggs).forEach(([aggKey, agg]) => {
    aggConfig.id = aggKey;
    Object.entries(agg as Record<string, unknown>).forEach(([name, value]) => {
      if (name === 'aggs' && value) {
        aggConfig.aggs = {};
        Object.entries(value as Record<string, unknown>).forEach(([subAggKey, subRawAgg]) => {
          const subAgg = getAggConfigForRawAggs(subRawAgg as Record<string, any>);
          if (subAgg) {
            aggConfig.aggs![subAgg.id] = { ...subAgg, id: subAggKey };
          }
        });
      } else {
        aggConfig.type = getAggTypeFn(name)?.type ?? name;
        Object.assign(aggConfig, { [name]: value });
      }
    });
  });

  return aggConfig as DataFrameAggConfig;
};

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
      // TODO: MQL best guess, get timestamp field and caculate it here
      return searchResponse;
    }
    searchResponse.aggregations = Object.entries(dataWithAggs.aggs).reduce(
      (acc: Record<string, unknown>, [id, value]) => {
        const aggConfig = dataWithAggs.meta?.aggs;
        if (id === 'other-filter') {
          const buckets = value as DataFrameBucketAgg[];
          buckets.forEach((bucket) => {
            const bucketValue = bucket.value;
            searchResponse.hits.total += bucketValue;
          });
          acc[id] = {
            buckets: [{ '': { doc_count: 0 } }],
          };
          return acc;
        }
        if (aggConfig && aggConfig.type === 'buckets') {
          const buckets = value as DataFrameBucketAgg[];
          acc[id] = {
            buckets: buckets.map((bucket) => {
              const bucketValue = bucket.value;
              searchResponse.hits.total += bucketValue;
              return {
                key_as_string: bucket.key,
                key: (aggConfig as DataFrameAggConfig).date_histogram
                  ? new Date(bucket.key).getTime()
                  : bucket.key,
                doc_count: bucketValue,
              };
            }),
          };
          return acc;
        }
        acc[id] = Array.isArray(value) ? value[0] : value;
        return acc;
      },
      {}
    );
  }

  return searchResponse;
};

/**
 * Formats the field value.
 *
 * @param field - field object
 * @param value - value to format
 * @returns formatted value
 */
export const formatFieldValue = (field: IFieldType | Partial<IFieldType>, value: any): any => {
  return field.format && field.format.convert ? field.format.convert(value) : value;
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
  const dateMathParse = (date: string) => {
    const parsedDate = datemath.parse(date);
    return parsedDate ? parsedDate.utc().format(dateFormat) : '';
  };

  const fromDate = dateMathParse(dateRange.from);
  const toDate = dateMathParse(dateRange.to);

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
 * Updates the data frame metadata. Metadata is used to store the aggregation configuration.
 * It also stores the query string used to fetch the data frame aggregations.
 *
 * @param params - { dataFrame, qs, aggConfig, timeField, timeFilter, getAggQsFn }
 */
export const updateDataFrameMeta = ({
  dataFrame,
  query,
  aggConfig,
  timeField,
  timeFilter,
  getAggQsFn,
}: {
  dataFrame: IDataFrame;
  query: Query;
  aggConfig: DataFrameAggConfig;
  timeField: any;
  timeFilter: string;
  getAggQsFn: GetDataFrameAggQsFn;
}) => {
  dataFrame.meta = {
    ...dataFrame?.meta,
    aggs: aggConfig,
    aggsQs: {
      [aggConfig.id]: getAggQsFn({
        query,
        aggConfig,
        timeField,
        timeFilter,
      }),
    },
  };

  if (aggConfig.aggs) {
    const subAggs = aggConfig.aggs as Record<string, DataFrameAggConfig>;
    for (const [key, subAgg] of Object.entries(subAggs)) {
      const subAggConfig: Record<string, any> = { [key]: subAgg };
      dataFrame.meta.aggsQs[subAgg.id] = getAggQsFn({
        query,
        aggConfig: subAggConfig as DataFrameAggConfig,
        timeField,
        timeFilter,
      });
    }
  }
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
