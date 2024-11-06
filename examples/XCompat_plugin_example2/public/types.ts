import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface ExamplePlugin2PluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExamplePlugin2PluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
