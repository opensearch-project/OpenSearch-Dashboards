/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { OsdClient, SavedObject } from '../client';
import { OsdctlConfig, getActiveProfile } from '../config';
import { printStatus, printHeader, printError } from '../utils/output';

export interface ValidateOptions {
  inputDir: string;
  server: boolean;
  config: OsdctlConfig;
}

/**
 * Read all JSON/YAML files from a directory and parse them as saved objects.
 */
export function readBuiltFiles(inputDir: string): Array<{ filePath: string; object: SavedObject }> {
  const results: Array<{ filePath: string; object: SavedObject }> = [];
  const absDir = path.resolve(inputDir);

  if (!fs.existsSync(absDir)) {
    return results;
  }

  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (ext !== '.json' && ext !== '.yaml' && ext !== '.yml') continue;

    const filePath = path.join(absDir, entry.name);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = (ext === '.yaml' || ext === '.yml')
        ? yaml.load(content)
        : JSON.parse(content);
      results.push({ filePath, object: parsed as SavedObject });
    } catch {
      // Skip files that can't be parsed
      printError(`Failed to parse ${entry.name}`);
    }
  }

  return results;
}

/**
 * Perform local validation of a saved object.
 */
function validateLocally(obj: SavedObject): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj.type || typeof obj.type !== 'string') {
    errors.push('Missing or invalid "type" field');
  }

  if (!obj.id || typeof obj.id !== 'string') {
    errors.push('Missing or invalid "id" field');
  }

  if (!obj.attributes || typeof obj.attributes !== 'object') {
    errors.push('Missing or invalid "attributes" field');
  }

  if (obj.references && !Array.isArray(obj.references)) {
    errors.push('"references" must be an array');
  }

  if (obj.references && Array.isArray(obj.references)) {
    for (const ref of obj.references) {
      if (!ref.type || !ref.id || !ref.name) {
        errors.push('Each reference must have "type", "id", and "name" fields');
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Execute the validate command.
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  const { inputDir, server, config } = options;

  printHeader('Validating dashboard definitions');

  const files = readBuiltFiles(inputDir);

  if (files.length === 0) {
    printError(`No files found in ${inputDir}. Run 'osdctl build' first.`);
    process.exitCode = 1;
    return;
  }

  let allValid = true;

  if (server) {
    // Server-side validation
    const profile = getActiveProfile(config);
    const client = new OsdClient(profile);
    const objects = files.map((f) => f.object);

    try {
      const results = await client.validate(objects);
      for (let i = 0; i < files.length; i++) {
        const result = results[i];
        const fileName = path.basename(files[i].filePath);
        if (result && result.valid) {
          printStatus('VALID', fileName, 'green');
        } else {
          allValid = false;
          printStatus('ERROR', fileName, 'red');
          if (result && result.errors) {
            for (const err of result.errors) {
              console.log(`         ${err.path}: ${err.message}`);
            }
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      printError(`Server validation failed: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  } else {
    // Local validation
    for (const { filePath, object } of files) {
      const fileName = path.basename(filePath);
      const result = validateLocally(object);
      if (result.valid) {
        printStatus('VALID', fileName, 'green');
      } else {
        allValid = false;
        printStatus('ERROR', fileName, 'red');
        for (const err of result.errors) {
          console.log(`         ${err}`);
        }
      }
    }
  }

  if (!allValid) {
    process.exitCode = 1;
    console.log('\nValidation failed with errors.');
  } else {
    console.log(`\nAll ${files.length} file(s) are valid.`);
  }
}
