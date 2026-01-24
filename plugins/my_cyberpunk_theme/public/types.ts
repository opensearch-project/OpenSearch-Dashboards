import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface MyCyberpunkThemePluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MyCyberpunkThemePluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
