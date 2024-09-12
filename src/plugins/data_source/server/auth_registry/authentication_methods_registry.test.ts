/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthenticationMethodRegistry } from './authentication_methods_registry';
import { AuthenticationMethod } from '../../server/types';

const createAuthenticationMethod = (
  authMethod: Partial<AuthenticationMethod>
): AuthenticationMethod => ({
  name: 'unknown',
  credentialProvider: jest.fn(),
  ...authMethod,
});

describe('AuthenticationMethodRegistry', () => {
  let registry: AuthenticationMethodRegistry;

  beforeEach(() => {
    registry = new AuthenticationMethodRegistry();
  });

  it('allows to register authentication method', () => {
    registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeA' }));
    registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeB' }));
    registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeC' }));

    expect(
      registry
        .getAllAuthenticationMethods()
        .map((type) => type.name)
        .sort()
    ).toEqual(['typeA', 'typeB', 'typeC']);
  });

  it('throws when trying to register the same authentication method twice', () => {
    registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeA' }));
    registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeB' }));
    expect(() => {
      registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeA' }));
    }).toThrowErrorMatchingInlineSnapshot(`"Authentication method 'typeA' is already registered"`);
  });

  describe('#getAuthenticationMethod', () => {
    it(`retrieve a type by it's name`, () => {
      const typeA = createAuthenticationMethod({ name: 'typeA' });
      const typeB = createAuthenticationMethod({ name: 'typeB' });
      registry.registerAuthenticationMethod(typeA);
      registry.registerAuthenticationMethod(typeB);
      registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeC' }));

      expect(registry.getAuthenticationMethod('typeA')).toEqual(typeA);
      expect(registry.getAuthenticationMethod('typeB')).toEqual(typeB);
      expect(registry.getAuthenticationMethod('unknownType')).toBeUndefined();
    });

    it('forbids to mutate the registered types', () => {
      registry.registerAuthenticationMethod(
        createAuthenticationMethod({
          name: 'typeA',
          credentialProvider: jest.fn(),
        })
      );

      const typeA = registry.getAuthenticationMethod('typeA')!;

      expect(() => {
        typeA.credentialProvider = jest.fn();
      }).toThrow();
      expect(() => {
        typeA.name = 'foo';
      }).toThrow();
      expect(() => {
        typeA.credentialProvider = jest.fn();
      }).toThrow();
    });
  });

  describe('#getAllTypes', () => {
    it('returns all registered types', () => {
      const typeA = createAuthenticationMethod({ name: 'typeA' });
      const typeB = createAuthenticationMethod({ name: 'typeB' });
      const typeC = createAuthenticationMethod({ name: 'typeC' });
      registry.registerAuthenticationMethod(typeA);
      registry.registerAuthenticationMethod(typeB);

      const registered = registry.getAllAuthenticationMethods();
      expect(registered.length).toEqual(2);
      expect(registered).toContainEqual(typeA);
      expect(registered).toContainEqual(typeB);
      expect(registered).not.toContainEqual(typeC);
    });

    it('does not mutate the registered types when altering the list', () => {
      registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeA' }));
      registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeB' }));
      registry.registerAuthenticationMethod(createAuthenticationMethod({ name: 'typeC' }));

      const types = registry.getAllAuthenticationMethods();
      types.splice(0, 3);

      expect(registry.getAllAuthenticationMethods().length).toEqual(3);
    });
  });
});
