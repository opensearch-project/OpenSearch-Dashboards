/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

declare global {
  namespace Window {
    interface Config {
      appName: string;
      documentationTroubleshootingLink?: string;
      serverBasePath: string;
    }
  }

  interface Window {
    __CONFIG: Window.Config;
  }
}

export {};
