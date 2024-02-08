/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSuperSelectOption } from '@elastic/eui';
import { AuthTypeContent } from 'src/plugins/data_source/common/data_sources';

export interface AuthMethodUIElements {
  credentialForm: React.JSX.Element;
  credentialSourceOption: EuiSuperSelectOption<string>;
  credentialsFormValues: AuthTypeContent;
}

export type IAuthenticationMethodRegistery = Omit<
  AuthenticationMethodRegistery,
  'registerAuthenticationMethod'
>;

export class AuthenticationMethodRegistery {
  private readonly authMethods = new Map<string, AuthMethodUIElements>();
  /**
   * Register a authMethods with function to return credentials inside the registry.
   * Authentication Method can only be registered once. subsequent calls with the same method name will throw an error.
   */
  public registerAuthenticationMethod(name: string, authMethodUIElements: AuthMethodUIElements) {
    if (this.authMethods.has(name)) {
      throw new Error(`Authentication method '${name}' is already registered`);
    }
    this.authMethods.set(name, authMethodUIElements);
  }

  public getAllAuthenticationMethods() {
    return [...this.authMethods.values()];
  }

  public getAuthenticationMethod(name: string) {
    return this.authMethods.get(name);
  }
}
