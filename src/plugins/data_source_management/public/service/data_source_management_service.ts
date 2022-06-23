import { HttpSetup } from '../../../../core/public';

interface SetupDependencies {
  httpClient: HttpSetup;
}

/**
 * Index patterns management service
 *
 * @internal
 */
export class DataSourceManagementService {
  constructor() {}

  public setup({ httpClient }: SetupDependencies) {}

  public start() {}

  public stop() {
    // nothing to do here yet.
  }
}

// /** @internal */
// export type IndexPatternManagementServiceSetup = ReturnType<IndexPatternManagementService['setup']>;
// export type IndexPatternManagementServiceStart = ReturnType<IndexPatternManagementService['start']>;
