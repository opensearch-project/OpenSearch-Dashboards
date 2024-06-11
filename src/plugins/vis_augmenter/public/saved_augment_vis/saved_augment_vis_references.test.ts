/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractReferences,
  injectReferences,
  VIS_REFERENCE_NAME,
} from './saved_augment_vis_references';
import { AugmentVisSavedObject } from './types';

describe('extractReferences()', () => {
  test('extracts nothing if visId is null', () => {
    const doc = {
      id: '1',
      attributes: {
        foo: true,
      },
      references: [],
    };
    const updatedDoc = extractReferences(doc);
    expect(updatedDoc).toMatchInlineSnapshot(`
      Object {
        "attributes": Object {
          "foo": true,
        },
        "references": Array [],
      }
    `);
  });

  test('extracts references from visId', () => {
    const doc = {
      id: '1',
      attributes: {
        foo: true,
        visId: 'test-id',
      },
      references: [],
    };
    const updatedDoc = extractReferences(doc);
    expect(updatedDoc).toMatchInlineSnapshot(`
      Object {
        "attributes": Object {
          "foo": true,
          "visName": "visualization_0",
        },
        "references": Array [
          Object {
            "id": "test-id",
            "name": "visualization_0",
            "type": "visualization",
          },
        ],
      }
    `);
  });
});

describe('injectReferences()', () => {
  test('injects nothing when visName is null', () => {
    const context = ({
      id: '1',
      pluginResourceId: 'test-resource-id',
      visLayerExpressionFn: 'test-fn',
    } as unknown) as AugmentVisSavedObject;
    injectReferences(context, []);
    expect(context).toMatchInlineSnapshot(`
      Object {
        "id": "1",
        "pluginResourceId": "test-resource-id",
        "visLayerExpressionFn": "test-fn",
      }
    `);
  });

  test('injects references into context', () => {
    const context = ({
      id: '1',
      pluginResourceId: 'test-resource-id',
      visLayerExpressionFn: 'test-fn',
      visName: VIS_REFERENCE_NAME,
    } as unknown) as AugmentVisSavedObject;
    const references = [
      {
        name: VIS_REFERENCE_NAME,
        type: 'visualization',
        id: 'test-id',
      },
    ];
    injectReferences(context, references);
    expect(context).toMatchInlineSnapshot(`
      Object {
        "id": "1",
        "pluginResourceId": "test-resource-id",
        "visId": "test-id",
        "visLayerExpressionFn": "test-fn",
      }
    `);
  });

  test(`fails when it can't find the saved object reference in the array`, () => {
    const context = ({
      id: '1',
      pluginResourceId: 'test-resource-id',
      visLayerExpressionFn: 'test-fn',
      visName: VIS_REFERENCE_NAME,
    } as unknown) as AugmentVisSavedObject;
    expect(() => injectReferences(context, [])).toThrowErrorMatchingInlineSnapshot(
      `"Could not find visualization reference \\"${VIS_REFERENCE_NAME}\\""`
    );
  });
});
