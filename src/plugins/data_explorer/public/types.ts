import { NavigationPublicPluginStart } from '../../navigation/public';

export interface DataExplorerPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
