export interface ApplicationConfigPluginSetup {
  setConfigurationClient: (inputConfigurationClient: ConfigurationClient) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationConfigPluginStart {}

export interface ConfigurationClient {
  existsConfig(): Promise<boolean>;
}
