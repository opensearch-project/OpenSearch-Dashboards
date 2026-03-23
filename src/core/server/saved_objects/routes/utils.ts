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
