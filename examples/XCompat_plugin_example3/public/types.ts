import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface ExamplePlugin3PluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExamplePlugin3PluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
