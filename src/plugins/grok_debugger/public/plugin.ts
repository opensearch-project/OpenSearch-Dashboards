/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Plugin, CoreSetup } from 'src/core/public';
import { DevToolsSetup } from '../../dev_tools/public';

interface GrokDebuggerSetupDeps {
  devTools: DevToolsSetup;
}

export class GrokDebuggerPlugin implements Plugin<void, void> {
  public setup({ http }: CoreSetup, { devTools }: GrokDebuggerSetupDeps) {
    devTools.register({
      id: 'grok_debugger',
      order: 2,
      title: i18n.translate('grokDebugger.displayName', {
        defaultMessage: 'Grok Debugger',
      }),
      enableRouting: false,
      mount: async ({ element, dataSourceId }) => {
        const { createRoot } = await import('react-dom/client');
        const React = await import('react');
        const { GrokDebugger } = await import('./grok_debugger');

        const root = createRoot(element);
        root.render(React.createElement(GrokDebugger, { http, dataSourceId }));
        return () => root.unmount();
      },
    });
  }

  public start() {}
}
