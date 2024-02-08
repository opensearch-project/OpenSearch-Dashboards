/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthMethodValues } from '../../server/types';

export type IAuthenticationMethodRegistery = Omit<
  AuthenticationMethodRegistery,
  'registerAuthenticationMethod'
>;

export class AuthenticationMethodRegistery {
  private readonly authMethods = new Map<string, AuthMethodValues>();
  /**
   * Register a authMethods with function to return credentials inside the registry.
   * Authentication Method can only be registered once. subsequent calls with the same method name will throw an error.
   */
  public registerAuthenticationMethod(name: string, authMethodValues: AuthMethodValues) {
    if (this.authMethods.has(name)) {
      throw new Error(`Authentication method '${name}' is already registered`);
    }
    this.authMethods.set(name, authMethodValues);
  }

  public getAllAuthenticationMethods() {
    return [...this.authMethods.values()];
  }

  public getAuthenticationMethod(name: string) {
    return this.authMethods.get(name);
  }
}
