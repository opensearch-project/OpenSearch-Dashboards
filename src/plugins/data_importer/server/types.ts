/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { OpenSearchClient } from '../../../core/server';

export interface DataImporterPluginSetup {
  /**
   * Register custom file type processors to ingest into OpenSearch
   * @param fileType The file type to register a processor for (should NOT be csv, ndjson, or json filetypes)
   * @param fileProcessor
   * @throws errors if a filetype is already registered in this plugin or another plugin
   */
  registerFileProcessor: (fileType: string, fileProcessor: IFileProcessor) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataImporterPluginStart {}

export interface IngestOptions {
  /**
   * OpenSearch client (local cluster or an external datasource)
   */
  client: OpenSearchClient;

  /**
   * The index name of an existing OpenSearch index
   */
  indexName: string;

  /**
   * Used for CSV file types, indicates the delimiter to use when parsing the CSV file
   */
  delimiter?: string;

  /**
   * Supplied when multiple data sources (MDS) is enabled
   */
  dataSourceId?: string;
}

export interface IngestResponse {
  /**
   * Total count of documents in file successfully or unsuccessfully parsed/ingested
   */
  total: number;
  message: string;
  /**
   * List of row numbers that failed to be parsed/ingested
   */
  failedRows: number[];
}

export interface ValidationOptions {
  /**
   * Used for CSV file types, indicates the delimiter to use when parsing the CSV file
   */
  delimiter?: string;
}
export type ParseOptions = ValidationOptions;

/**
 * Processor that handles a particular file type
 */
export interface IFileProcessor {
  /**
   * Given text input, validate that it is in the expected format
   * @param text
   * @param options
   * @returns
   * @throws Can throw an error if text doesn't match expected format
   */
  validateText?: (text: string, options: ValidationOptions) => Promise<boolean>;

  /**
   * Assuming valid text input, handle the ingestion into OpenSearch
   * @param text
   * @param options
   * @returns
   * @throws Can throw server errors when attempting to ingest into OpenSearch
   */
  ingestText?: (text: string, options: IngestOptions) => Promise<IngestResponse>;

  /**
   * Given an arbitrary file stream, handle the validation and ingestion into OpenSearch
   * @param file
   * @param options
   * @returns
   * @throws Can throw server errors when attempting to ingest into OpenSearch
   */
  ingestFile: (file: Readable, options: IngestOptions) => Promise<IngestResponse>;

  /**
   * Given an arbitrary file stream, parse the file into an object array
   * @param file
   * @param limit
   * @param ingestOptions
   * @returns
   */
  parseFile: (
    file: Readable,
    limit: number,
    options: ParseOptions
  ) => Promise<Array<Record<string, any>>>;
}

export interface FileStream extends Readable {
  hapi: {
    filename: string;
  };
}
