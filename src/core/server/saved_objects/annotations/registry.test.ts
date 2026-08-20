/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectAnnotationTypeRegistry } from './registry';

describe('SavedObjectAnnotationTypeRegistry', () => {
  it('registers and returns annotation types', () => {
    const registry = new SavedObjectAnnotationTypeRegistry();
    registry.register({
      type: 'tag',
      supportedObjectTypes: ['dashboard', 'dashboard', 'visualization'],
    });

    expect(registry.get('tag')).toEqual({
      type: 'tag',
      supportedObjectTypes: ['dashboard', 'visualization'],
    });
  });

  it('rejects duplicate annotation types', () => {
    const registry = new SavedObjectAnnotationTypeRegistry();
    registry.register({ type: 'tag', supportedObjectTypes: ['dashboard'] });

    expect(() =>
      registry.register({ type: 'tag', supportedObjectTypes: ['visualization'] })
    ).toThrow("Annotation type 'tag' is already registered");
  });

  it('rejects unregistered annotation types', () => {
    const registry = new SavedObjectAnnotationTypeRegistry();

    expect(() => registry.get('tag')).toThrow("Annotation type 'tag' is not registered");
  });
});
