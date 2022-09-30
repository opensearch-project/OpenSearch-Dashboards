/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { createFailError } from '@osd/dev-utils';
import { FileUpdateContext, ObjectUpdateContext, VersionContext } from '../contexts';

export async function updateVersions({
  log,
  sourceDir,
  pluginVersion,
  compatibilityVersion,
}: VersionContext): Promise<boolean | undefined> {
  // If any of the versions are falsy, we will skip updating them in updateObject
  if (pluginVersion && !/^\d+(\.\d+){2,}/.test(pluginVersion))
    throw createFailError('The plugin version should start with #.#.# where # are numbers');

  if (compatibilityVersion && !/^\d+(\.\d+){2,}/.test(compatibilityVersion))
    throw createFailError(
      `The plugin's compatibility version should start with #.#.# where # are numbers`
    );

  const updateManifestFile = updateFile({
    log,
    file: path.join(sourceDir, 'opensearch_dashboards.json'),
    updates: {
      version: pluginVersion,
      opensearchDashboardsVersion: compatibilityVersion,
    },
  });

  const updatePackageJson = updateFile({
    log,
    file: path.join(sourceDir, 'package.json'),
    updates: {
      version: pluginVersion,
      opensearchDashboards: {
        version: compatibilityVersion,
        templateVersion: compatibilityVersion,
      },
    },
  });

  await Promise.all([updateManifestFile, updatePackageJson]);

  return true;
}

async function updateFile({ log, file, updates }: FileUpdateContext) {
  log.info('Updating', file);

  let json;

  try {
    json = JSON.parse(await readFile(file, 'utf8'));
  } catch (ex) {
    log.error(ex);
    throw createFailError(`Failed to parse ${file}`);
  }

  const context: ObjectUpdateContext = {
    original: json,
    updates,
  };
  updateObject(context);

  try {
    await writeFile(file, JSON.stringify(json, null, 2), 'utf8');
  } catch (ex) {
    log.error(ex);
    throw createFailError(`Failed to update ${file}`);
  }

  log.success(`Updated`, file);
}

// Copies values in `updates` onto `obj` only if the keys exist
function updateObject({ original, updates }: ObjectUpdateContext) {
  for (const key in updates) {
    if (!updates[key]) continue;

    // If `key` is not found in `original`, just skip it
    if (key in original) {
      // If both are objects, merge them
      if (updates[key] === 'object' && typeof original[key] === 'object') {
        updateObject({
          original: original[key],
          updates: updates[key],
        } as ObjectUpdateContext);
        // If the updated value is falsy, skip it
      } else if (updates[key]) {
        original[key] = updates[key];
      }
    }
  }
}
