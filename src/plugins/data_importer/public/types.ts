import { NavigationPublicPluginStart } from '../../navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataUploaderPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataUploaderPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
