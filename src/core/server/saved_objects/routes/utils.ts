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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Readable } from 'stream';
import { SavedObject, SavedObjectsExportResultDetails } from 'src/core/server';
import {
  createSplitStream,
  createMapStream,
  createFilterStream,
  createPromiseFromStreams,
  createListStream,
  createConcatStream,
} from '../../utils/streams';

export async function createSavedObjectsStreamFromNdJson(ndJsonStream: Readable) {
  const savedObjects = await createPromiseFromStreams([
    ndJsonStream,
    createSplitStream('\n'),
    createMapStream((str: string) => {
      if (str && str.trim() !== '') {
        return JSON.parse(str);
      }
    }),
    createFilterStream<SavedObject | SavedObjectsExportResultDetails>(
      (obj) => !!obj && !(obj as SavedObjectsExportResultDetails).exportedCount
    ),
    createConcatStream([]),
  ]);
  return createListStream(savedObjects);
}

export function validateTypes(types: string[], supportedTypes: string[]): string | undefined {
  const invalidTypes = types.filter((t) => !supportedTypes.includes(t));
  if (invalidTypes.length) {
    return `Trying to export non-exportable type(s): ${invalidTypes.join(', ')}`;
  }
}

export function validateObjects(
  objects: Array<{ id: string; type: string }>,
  supportedTypes: string[]
): string | undefined {
  const invalidObjects = objects.filter((obj) => !supportedTypes.includes(obj.type));
  if (invalidObjects.length) {
    return `Trying to export object(s) with non-exportable types: ${invalidObjects
      .map((obj) => `${obj.type}:${obj.id}`)
      .join(', ')}`;
  }
}

export interface DependencyResolutionResult {
  ordered: Array<{ type: string; id: string; [key: string]: unknown }>;
  circular?: string[]; // IDs involved in circular dependency
}

/**
 * Resolves the dependency order of resources using topological sort (Kahn's algorithm).
 * Resources are sorted so that dependencies come before the resources that reference them.
 * If circular dependencies are detected, the `circular` field contains the IDs involved.
 */
export function resolveDependencyOrder(
  resources: Array<{
    type: string;
    id: string;
    references?: Array<{ type: string; id: string; name: string }>;
  }>
): DependencyResolutionResult {
  // Build a map of composite key -> resource for quick lookup
  const resourceMap = new Map<string, (typeof resources)[number]>();
  for (const resource of resources) {
    resourceMap.set(`${resource.type}:${resource.id}`, resource);
  }

  // Build adjacency list and in-degree count.
  // An edge from A -> B means "A must come before B" (B depends on A).
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // key -> list of keys that depend on it

  for (const resource of resources) {
    const key = `${resource.type}:${resource.id}`;
    if (!inDegree.has(key)) {
      inDegree.set(key, 0);
    }
    if (!dependents.has(key)) {
      dependents.set(key, []);
    }
  }

  for (const resource of resources) {
    const key = `${resource.type}:${resource.id}`;
    if (resource.references) {
      for (const ref of resource.references) {
        const refKey = `${ref.type}:${ref.id}`;
        // Only consider references that point to resources in the batch
        if (resourceMap.has(refKey)) {
          inDegree.set(key, (inDegree.get(key) || 0) + 1);
          if (!dependents.has(refKey)) {
            dependents.set(refKey, []);
          }
          dependents.get(refKey)!.push(key);
        }
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [key, degree] of inDegree) {
    if (degree === 0) {
      queue.push(key);
    }
  }

  const ordered: Array<{ type: string; id: string; [key: string]: unknown }> = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const resource = resourceMap.get(current);
    if (resource) {
      ordered.push(resource);
    }

    for (const dep of dependents.get(current) || []) {
      const newDegree = (inDegree.get(dep) ?? 0) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) {
        queue.push(dep);
      }
    }
  }

  // If not all resources were processed, there is a circular dependency
  if (ordered.length < resources.length) {
    const circular: string[] = [];
    for (const [key, degree] of inDegree) {
      if (degree > 0) {
        // Extract just the id portion from the composite key
        const resource = resourceMap.get(key);
        if (resource) {
          circular.push(resource.id);
        }
      }
    }
    return { ordered, circular };
  }

  return { ordered };
}

/**
 * Recursively compares two values for deep equality.
 * Used by bulk_apply and diff routes to determine if saved object attributes have changed.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => deepEqual(val, b[idx]));
    }
    if (Array.isArray(a) || Array.isArray(b)) return false;
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  return false;
}
