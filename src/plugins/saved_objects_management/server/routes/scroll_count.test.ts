/** @jest-environment node */

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

import { schema } from '@osd/config-schema';

// Replicate the route's body schema to test maxSize enforcement
const bodySchema = schema.object({
  typesToInclude: schema.arrayOf(schema.string(), { maxSize: 100 }),
  namespacesToInclude: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 100 })),
  searchString: schema.maybe(schema.string()),
  workspaces: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 100 })),
  availableWorkspaces: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 100 })),
});

describe('scroll_count route schema validation', () => {
  it('accepts arrays within the 100-element limit', () => {
    const input = {
      typesToInclude: Array(100).fill('dashboard'),
      namespacesToInclude: Array(100).fill('default'),
    };
    expect(() => bodySchema.validate(input)).not.toThrow();
  });

  it('rejects typesToInclude exceeding 100 elements', () => {
    const input = { typesToInclude: Array(101).fill('dashboard') };
    expect(() => bodySchema.validate(input)).toThrow(/cannot be greater than \[100\]/);
  });

  it('rejects namespacesToInclude exceeding 100 elements', () => {
    const input = {
      typesToInclude: ['dashboard'],
      namespacesToInclude: Array(101).fill('ns'),
    };
    expect(() => bodySchema.validate(input)).toThrow(/cannot be greater than \[100\]/);
  });

  it('rejects workspaces exceeding 100 elements', () => {
    const input = {
      typesToInclude: ['dashboard'],
      workspaces: Array(101).fill('ws'),
    };
    expect(() => bodySchema.validate(input)).toThrow(/cannot be greater than \[100\]/);
  });

  it('rejects availableWorkspaces exceeding 100 elements', () => {
    const input = {
      typesToInclude: ['dashboard'],
      availableWorkspaces: Array(101).fill('ws'),
    };
    expect(() => bodySchema.validate(input)).toThrow(/cannot be greater than \[100\]/);
  });
});
