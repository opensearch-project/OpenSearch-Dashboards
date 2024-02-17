import { IScopedClusterClient } from 'src/core/server';

export interface ApplicationConfigPluginSetup {
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient;
  registerConfigurationClient: (inputConfigurationClient: ConfigurationClient) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationConfigPluginStart {}

export interface ConfigurationClient {
  getConfig(): Promise<Map<string, string>>;

  getEntityConfig(entity: string): Promise<any>;

  updateEntityConfig(entity: string, newValue: string): Promise<string>;

  deleteEntityConfig(entity: string): Promise<string>;
}
