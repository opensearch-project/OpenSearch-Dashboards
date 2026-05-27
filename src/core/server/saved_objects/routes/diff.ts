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
import { IRouter } from '../../http';
import { deepEqual } from './utils';

interface DiffEntry {
  op: 'add' | 'remove' | 'replace';
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Recursively computes the difference between two objects.
 * Returns an array of diff entries describing changes from `oldObj` to `newObj`.
 */
function computeDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  basePath: string = ''
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const currentPath = basePath ? `${basePath}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (!(key in oldObj)) {
      diffs.push({ op: 'add', path: currentPath, newValue: newVal });
    } else if (!(key in newObj)) {
      diffs.push({ op: 'remove', path: currentPath, oldValue: oldVal });
    } else if (isPlainObject(oldVal) && isPlainObject(newVal)) {
      diffs.push(
        ...computeDiff(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          currentPath
        )
      );
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (!deepEqual(oldVal, newVal)) {
        diffs.push({ op: 'replace', path: currentPath, oldValue: oldVal, newValue: newVal });
      }
    } else if (!deepEqual(oldVal, newVal)) {
      diffs.push({ op: 'replace', path: currentPath, oldValue: oldVal, newValue: newVal });
    }
  }

  return diffs;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// strictEqual and arraysEqual are now provided by the shared deepEqual utility from ./utils

export const registerDiffRoute = (router: IRouter) => {
  router.post(
    {
      path: '/_diff',
      validate: {
        body: schema.object({
          type: schema.string(),
          id: schema.string(),
          attributes: schema.recordOf(schema.string(), schema.any()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, id, attributes } = req.body;
      const savedObjectsClient = context.core.savedObjects.client;

      try {
        const existing = await savedObjectsClient.get(type, id);
        const existingAttributes = (existing.attributes as Record<string, unknown>) || {};
        const diff = computeDiff(existingAttributes, attributes);

        if (diff.length === 0) {
          return res.ok({ body: { status: 'unchanged' } });
        }

        return res.ok({
          body: {
            status: 'updated',
            diff,
          },
        });
      } catch (e) {
        if (e.output && e.output.statusCode === 404) {
          return res.ok({ body: { status: 'new' } });
        }
        throw e;
      }
    })
  );
};
