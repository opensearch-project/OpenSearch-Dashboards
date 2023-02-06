/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { map } from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginStart {}

export interface AuthInfo {
  user_name: string;
  entitlements: {
    [entitlement: string]: boolean;
  };
}

export interface ClientConfigType {
  readonly_mode: {
    roles: string[];
  };
  ui: {
    basicauth: {
      login: {
        title: string;
        subtitle: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    openid: {
      login: {
        buttonname: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    saml: {
      login: {
        buttonname: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    autologout: boolean;
    backend_configurable: boolean;
  };
  auth: {
    type: string | string[];
    anonymous_auth_enabled: boolean;
    logout_url: string;
  };
  idp: {
    setting: typeof map;
  };
}
