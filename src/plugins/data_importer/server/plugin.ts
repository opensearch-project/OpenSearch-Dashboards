/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { TypeOf } from '@osd/config-schema';
import { DataSourcePluginSetup } from '../../data_source/server';
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/server';
import { configSchema } from '../config';
import { DataImporterPluginSetup, DataImporterPluginStart } from './types';
import { importFileRoute } from './routes/import_file';
import { CSVParser } from './parsers/csv_parser';
import { importTextRoute } from './routes/import_text';
import { CSV_FILE_TYPE, JSON_FILE_TYPE, NDJSON_FILE_TYPE, PLUGIN_NAME } from '../common/constants';
import { NDJSONParser } from './parsers/ndjson_parser';
import { JSONParser } from './parsers/json_parser';
import { FileParserService } from './parsers/file_parser_service';
import { validateEnabledFileTypes } from './utils/util';
import { previewRoute } from './routes/preview';
import { catIndicesRoute } from './routes/cat_indices';

export interface DataImporterPluginSetupDeps {
  dataSource?: DataSourcePluginSetup;
}

export class DataImporterPlugin
  implements Plugin<DataImporterPluginSetup, DataImporterPluginStart> {
  private readonly fileParsers: FileParserService = new FileParserService();
  private config: TypeOf<typeof configSchema> | undefined;

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(
    core: CoreSetup,
    { dataSource }: DataImporterPluginSetupDeps
  ): Promise<DataImporterPluginSetup> {
    this.config = await this.initializerContext.config
      .create<TypeOf<typeof configSchema>>()
      .pipe(first())
      .toPromise();

    const router = core.http.createRouter();

    // Register default file parsers
    this.fileParsers.registerFileParser(CSV_FILE_TYPE, new CSVParser());
    this.fileParsers.registerFileParser(NDJSON_FILE_TYPE, new NDJSONParser());
    this.fileParsers.registerFileParser(JSON_FILE_TYPE, new JSONParser());

    // Register server side APIs
    importFileRoute(router, this.config, this.fileParsers, !!dataSource);
    importTextRoute(router, this.config, this.fileParsers, !!dataSource);
    previewRoute(router, this.config, this.fileParsers, !!dataSource);
    catIndicesRoute(router, !!dataSource);

    return {
      registerFileParser: (fileType, fileParser) => {
        this.fileParsers.registerFileParser(fileType, fileParser);
      },
    };
  }

  public start(_: CoreStart): DataImporterPluginStart {
    try {
      // Config values have to be validated at start() since file types can be registered in other plugins
      validateEnabledFileTypes(this.config!.enabledFileTypes, this.fileParsers);
    } catch (e) {
      throw new Error(`Error when calling start() for ${PLUGIN_NAME}: `, e);
    }

    return {};
  }

  public stop() {}
}
