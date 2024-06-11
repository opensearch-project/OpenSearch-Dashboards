import { DataPublicPluginSetup, DataPublicPluginStart } from 'src/plugins/data/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}

export interface QueryEnhancementsPluginSetupDependencies {
  data: DataPublicPluginSetup;
}

export interface QueryEnhancementsPluginStartDependencies {
  data: DataPublicPluginStart;
}
