import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
} from '../../../src/core/public';

import {
  MyCyberpunkThemePluginSetup,
  MyCyberpunkThemePluginStart,
  AppPluginStartDependencies,
} from './types';

import { PLUGIN_NAME } from '../common';

const THEME_SETTING = 'myCyberpunkTheme:enabled';
const BODY_CLASS = 'cyberpunk-theme';

export class MyCyberpunkThemePlugin
  implements Plugin<MyCyberpunkThemePluginSetup, MyCyberpunkThemePluginStart> {
  public setup(core: CoreSetup): MyCyberpunkThemePluginSetup {
    // Keep existing app registration
    core.application.register({
      id: 'myCyberpunkTheme',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(
          coreStart,
          depsStart as AppPluginStartDependencies,
          params
        );
      },
    });

    return {
      getGreeting() {
        return i18n.translate('myCyberpunkTheme.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: { name: PLUGIN_NAME },
        });
      },
    };
  }

  public start(core: CoreStart): MyCyberpunkThemePluginStart {
    const applyTheme = (enabled: boolean) => {
      document.body.classList.toggle(BODY_CLASS, enabled);
    };

    // (default = false)
    const enabled = core.uiSettings.get<boolean>(THEME_SETTING, false);
    applyTheme(enabled);

    // header toggle button
    core.chrome.navControls.registerRight({
      order: 1000,
      mount: (element: HTMLElement) => {
        const button = document.createElement('button');

        button.className =
          'euiButton euiButton--primary euiButton--small';
        button.innerText = 'Cyberpunk';

        button.onclick = async () => {
          const current =
            core.uiSettings.get<boolean>(THEME_SETTING, false);

          const next = !current;

          await core.uiSettings.set(THEME_SETTING, next);
          applyTheme(next);
        };

        element.appendChild(button);

        return () => {
          element.removeChild(button);
        };
      },
    });

    return {};
  }

  public stop() { }
}
