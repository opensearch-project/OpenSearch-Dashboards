/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deepFreeze } from '@osd/std';
import { AuthMethodType } from '../../server/types';

export type IAuthenticationMethodRegistery = Omit<
  AuthenticationMethodRegistery,
  'registerAuthenticationMethod'
>;

export class AuthenticationMethodRegistery {
  private readonly authMethods = new Map<string, AuthMethodType>();
  /**
   * Register a authMethods with function to return credentials inside the registry.
   * Authentication Method can only be registered once. subsequent calls with the same method name will throw an error.
   */
  public registerAuthenticationMethod(method: AuthMethodType) {
    if (this.authMethods.has(method.name)) {
      throw new Error(`Authentication method '${method.name}' is already registered`);
    }
    this.authMethods.set(method.name, deepFreeze(method) as AuthMethodType);
  }

  public getAllAuthenticationMethods() {
    return [...this.authMethods.values()];
  }

  public getAuthenticationMethod(name: string) {
    return this.authMethods.get(name);
  }
}
