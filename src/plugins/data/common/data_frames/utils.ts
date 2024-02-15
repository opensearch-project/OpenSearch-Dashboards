/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SearchResponse } from 'elasticsearch';
import datemath from '@elastic/datemath';
import { IDataFrame, IDataFrameWithAggs, PartialDataFrame } from './types';
import { IFieldType } from './fields';
import { IndexPatternFieldMap, IndexPatternSpec } from '../index_patterns';
import { IOpenSearchDashboardsSearchRequest } from '../search';

const name = 'data_frame';

export interface IDataFrameResponse extends SearchResponse<any> {
  type: typeof name;
  body: IDataFrame | IDataFrameWithAggs;
  took: number;
}

export const getRawQueryString = (
  searchRequest: IOpenSearchDashboardsSearchRequest
): string | undefined => {
  return searchRequest.params?.body?.query?.queries[0]?.query;
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
      _type: '',
      _id: '',
      _score: 0,
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
  if (field.name) {
    const fieldName = field.name.toLowerCase();
    // TODO: feels little biased to check if timestamp.
    // Has to be a better way to know so to be fair to all data sources
    if (fieldName.includes('date') || fieldName.includes('timestamp')) {
      return 'date';
    }
  }
  if (!field.values) return field.type;
  const firstValue = field.values.filter((value) => value !== null && value !== undefined)[0];
  if (firstValue instanceof Date || datemath.isDateTime(firstValue)) {
    return 'date';
  }
  return field.type;
};

export const getTimeField = (data: IDataFrame): IFieldType | undefined => {
  return data.fields.find((field) => field.type === 'date');
};

export const createDataFrame = (partial: PartialDataFrame): IDataFrame | IDataFrameWithAggs => {
  let size = 0;
  const fields = partial.fields.map((field) => {
    if (!field.values) {
      field.values = new Array(size);
    } else if (field.values.length > size) {
      size = field.values.length;
    }
    field.type = getFieldType(field);
    // if (!field.type) {
    // need to think if this needs to be mapped to OSD field type for example
    // PPL type for date is TIMESTAMP
    // OSD is expecting date
    //   field.type = get type
    // }
    // get timeseries field
    return field as IFieldType;
  });

  return {
    ...partial,
    fields,
    size,
  };
};

export const dataFrameToSpec = (dataFrame: IDataFrame): IndexPatternSpec => {
  return {
    id: 'data_frame',
    title: dataFrame.name,
    timeFieldName: getTimeField(dataFrame)?.name,
    fields: dataFrame.fields.reduce((acc, field) => {
      acc[field.name] = {
        name: field.name,
        type: field.type,
        aggregatable: true,
        searchable: true,
      };
      return acc;
    }, {} as IndexPatternFieldMap),
    // TODO: SQL dataSourceRef
  };
};
