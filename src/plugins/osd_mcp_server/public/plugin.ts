/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
// import './redux_bridge_client';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OsdMcpServerPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OsdMcpServerPluginStart {}

export class OsdMcpServerPlugin
  implements Plugin<OsdMcpServerPluginSetup, OsdMcpServerPluginStart> {
  public setup(core: CoreSetup): OsdMcpServerPluginSetup {
    console.log('🔧 OSD MCP SERVER PLUGIN: Public setup starting...');

    // The Redux bridge client is automatically initialized when imported
    console.log('🌉 OSD MCP SERVER PLUGIN: Redux bridge client loaded via import');
    console.log(
      '🔍 OSD MCP SERVER PLUGIN: Checking if reduxBridgeClient is available on window...'
    );
    console.log(
      '🔍 OSD MCP SERVER PLUGIN: window.reduxBridgeClient =',
      (window as any).reduxBridgeClient
    );

    return {};
  }

  public start(core: CoreStart): OsdMcpServerPluginStart {
    console.log('🚀 OSD MCP SERVER PLUGIN: Public start');
    console.log(
      '🔍 OSD MCP SERVER PLUGIN: Final check - window.reduxBridgeClient =',
      (window as any).reduxBridgeClient
    );
    return {};
  }

  public stop() {
    console.log('🛑 OSD MCP SERVER PLUGIN: Public stop');
  }
}
