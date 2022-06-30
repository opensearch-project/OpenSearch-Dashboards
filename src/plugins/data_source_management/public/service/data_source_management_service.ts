import { HttpSetup } from '../../../../core/public';
import { DataSourceCreationConfig, DataSourceCreationManager } from './creation';

interface SetupDependencies {
  httpClient: HttpSetup;
}

/**
 * Index patterns management service
 *
 * @internal
 */
export class DataSourceManagementService {
  dataSourceCreationManager: DataSourceCreationManager;

  constructor() {
    this.dataSourceCreationManager = new DataSourceCreationManager();
  }

  public setup({ httpClient }: SetupDependencies) {
    const creationManagerSetup = this.dataSourceCreationManager.setup(httpClient);
    creationManagerSetup.addCreationConfig(DataSourceCreationConfig);

    return {
      creation: creationManagerSetup,
    };
  }

  public start() {
    return {
      creation: this.dataSourceCreationManager.start(),
    };
  }

  public stop() {
    // nothing to do here yet.
  }
}

// /** @internal */
export type DataSourceManagementServiceSetup = ReturnType<DataSourceManagementService['setup']>;
export type DataSourceManagementServiceStart = ReturnType<DataSourceManagementService['start']>;
