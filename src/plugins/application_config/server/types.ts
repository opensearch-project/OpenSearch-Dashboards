import { IScopedClusterClient } from 'src/core/server';

export interface ApplicationConfigPluginSetup {
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient;
  registerConfigurationClient: (inputConfigurationClient: ConfigurationClient) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationConfigPluginStart {}

export interface ConfigurationClient {
  getConfig(): Promise<string>;

  getFeildConfig(documentName, fieldName);

  updateFeildConfig(documentName, fieldName, newValue);

  deleteFeildConfig(documentName, fieldName);
}
