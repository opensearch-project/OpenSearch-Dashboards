/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_NAME_AS_TITLE = 'Data Importer';
export const PLUGIN_ID = 'dataImporter';
export const PLUGIN_NAME = 'dataImporter';

export const CSV_FILE_TYPE = 'csv';
export const JSON_FILE_TYPE = 'json';
export const NDJSON_FILE_TYPE = 'ndjson';

export const DEFAULT_SUPPORTED_FILE_TYPES_LIST = [CSV_FILE_TYPE, JSON_FILE_TYPE, NDJSON_FILE_TYPE];

export const CSV_SUPPORTED_DELIMITERS = [',', ';', '\t', '|'];

export enum DYNAMIC_MAPPING_TYPES {
  NULL = 'null',
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  DOUBLE = 'double',
  INTEGER = 'integer',
  OBJECT = 'object',
  ARRAY = 'array',
  TEXT = 'text',
  KEYWORD = 'keyword',
  DATE = 'date',
}
