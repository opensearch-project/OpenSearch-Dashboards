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
import { SavedObjectConfig } from '../saved_objects_config';
import { exportSavedObjectsToStream } from '../export';
import { createPromiseFromStreams, createMapStream, createConcatStream } from '../../utils/streams';
import { SavedObject } from '../types';
import { validateTypes, validateObjects } from './utils';

/**
 * Recursively sorts all keys in an object to produce deterministic output.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Transforms a saved object into a clean, deterministic format suitable for
 * Dashboards-as-Code workflows. Strips internal metadata that is not
 * meaningful for declarative management.
 */
function cleanSavedObject(savedObject: SavedObject<unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {
    type: savedObject.type,
    id: savedObject.id,
    attributes: savedObject.attributes,
  };

  if (savedObject.references && savedObject.references.length > 0) {
    clean.references = savedObject.references;
  }

  if (savedObject.migrationVersion) {
    clean.migrationVersion = savedObject.migrationVersion;
  }

  return sortObjectKeys(clean) as Record<string, unknown>;
}

export const registerExportCleanRoute = (router: IRouter, config: SavedObjectConfig) => {
  const { maxImportExportSize } = config;

  router.post(
    {
      path: '/_export_clean',
      validate: {
        body: schema.object({
          type: schema.maybe(schema.oneOf([schema.string(), schema.arrayOf(schema.string())])),
          objects: schema.maybe(
            schema.arrayOf(
              schema.object({
                type: schema.string(),
                id: schema.string(),
              }),
              { maxSize: maxImportExportSize }
            )
          ),
          search: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { type, objects, search } = req.body;
      const types = typeof type === 'string' ? [type] : type;

      // Validate types and objects against the type registry
      const supportedTypes = context.core.savedObjects.typeRegistry
        .getImportableAndExportableTypes()
        .map((t) => t.name);

      if (types) {
        const validationError = validateTypes(types, supportedTypes);
        if (validationError) {
          return res.badRequest({ body: { message: validationError } });
        }
      }
      if (objects) {
        const validationError = validateObjects(objects, supportedTypes);
        if (validationError) {
          return res.badRequest({ body: { message: validationError } });
        }
      }

      const exportStream = await exportSavedObjectsToStream({
        savedObjectsClient,
        types,
        search,
        objects,
        exportSizeLimit: maxImportExportSize,
        includeReferencesDeep: false,
        excludeExportDetails: true,
      });

      const savedObjects: SavedObject[] = await createPromiseFromStreams([
        exportStream,
        createMapStream((obj: unknown) => obj),
        createConcatStream([]),
      ]);

      // Clean and sort objects for deterministic output
      const cleanObjects = savedObjects.map(cleanSavedObject);

      // Sort by type then id for deterministic ordering
      cleanObjects.sort((a, b) => {
        const typeCompare = String(a.type).localeCompare(String(b.type));
        if (typeCompare !== 0) return typeCompare;
        return String(a.id).localeCompare(String(b.id));
      });

      return res.ok({
        body: cleanObjects,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    })
  );
};
