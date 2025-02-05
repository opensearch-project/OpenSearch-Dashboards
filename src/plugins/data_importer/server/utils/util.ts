/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingProperty, MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import _ from 'lodash';
import moment from 'moment';
import { FileParserService } from '../parsers/file_parser_service';
import { OpenSearchClient, RequestHandlerContext } from '../../../../core/server';
import { DYNAMIC_MAPPING_TYPES } from '../../common';

export const decideClient = async (
  dataSourceEnabled: boolean,
  context: RequestHandlerContext,
  dataSourceId?: string
): Promise<OpenSearchClient> => {
  return dataSourceEnabled && dataSourceId
    ? await context.dataSource.opensearch.getClient(dataSourceId)
    : context.core.opensearch.client.asCurrentUser;
};

export const validateEnabledFileTypes = (fileTypes: string[], fileParsers: FileParserService) => {
  const nonRegisteredFileTypes = fileTypes.filter(
    (fileType) => !fileParsers.hasFileParserBeenRegistered(fileType)
  );
  if (nonRegisteredFileTypes.length > 0) {
    throw new Error(
      `The following enabledFileTypes are not registered: ${nonRegisteredFileTypes.join(', ')}`
    );
  }
};

export const determineMapping = (
  document: Record<string, any>,
  nestedObjectsLimit: number
): MappingTypeMapping => {
  return {
    dynamic: true,
    date_detection: true,
    ...determineType(document, 1, nestedObjectsLimit),
  };
};

export const determineType = (
  value: any,
  currentNestedCount: number,
  nestedObjectsLimit: number
): Record<string, MappingProperty> | MappingProperty => {
  if (currentNestedCount >= nestedObjectsLimit) {
    throw Error(`Current document exceeds nested object limit of ${nestedObjectsLimit}`);
  }

  switch (true) {
    case Array.isArray(value) && value.length < 1:
    case value == null:
      return { type: DYNAMIC_MAPPING_TYPES.NULL };
    case value === 'true' || value === 'false' || typeof value === 'boolean':
      return { type: DYNAMIC_MAPPING_TYPES.BOOLEAN };
    case !isNaN(Number(value)):
      return { type: determineNumberType(Number(value)) };
    case isValidDate(_.toString(value)):
      return { type: DYNAMIC_MAPPING_TYPES.DATE };
    case Array.isArray(value) && value.length > 0:
      return determineType(value[0], currentNestedCount, nestedObjectsLimit);
    case value && typeof value === 'object' && !Array.isArray(value):
      const properties: Record<string, MappingProperty> = {};
      Object.keys(value).forEach((key) => {
        properties[key] = determineType(value[key], currentNestedCount + 1, nestedObjectsLimit);
      });
      return { properties };
    default:
      return {
        type: DYNAMIC_MAPPING_TYPES.TEXT,
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      };
  }
};

export const determineNumberType = (value: number) => {
  if (Number.isSafeInteger(value)) {
    return DYNAMIC_MAPPING_TYPES.INTEGER;
  } else if (!Number.isInteger(value)) {
    return DYNAMIC_MAPPING_TYPES.FLOAT;
  } else {
    return DYNAMIC_MAPPING_TYPES.DOUBLE;
  }
};

export const isValidDate = (date: string) => {
  return (
    moment(date, moment.ISO_8601, true).isValid() || moment(date, moment.RFC_2822, true).isValid()
  );
};
