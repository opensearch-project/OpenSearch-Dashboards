/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as readline from 'readline';
import * as path from 'path';
import { OsdClient, ApplyResult, SavedObject } from '../client';
import { OsdctlConfig, getActiveProfile, getResolvedVariables } from '../config';
import { printStatus, printHeader, printError, printTable } from '../utils/output';
import { substituteVariables } from '../utils/variables';
import { readBuiltFiles } from './validate';

export interface ApplyOptions {
  inputDir: string;
  dryRun: boolean;
  confirm: boolean;
  config: OsdctlConfig;
}

/**
 * Stamp managed-by label on all objects before applying.
 */
function stampManagedBy(objects: SavedObject[]): SavedObject[] {
  return objects.map((obj) => ({
    ...obj,
    labels: {
      ...(obj.labels || {}),
      'managed-by': 'osdctl',
    },
  }));
}

/**
 * Prompt for user confirmation.
 */
function promptConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Execute the apply command to deploy dashboards.
 */
export async function applyCommand(options: ApplyOptions): Promise<void> {
  const { inputDir, dryRun, confirm, config } = options;

  const modeLabel = dryRun ? '(dry run)' : '';
  printHeader(`Applying dashboard definitions ${modeLabel}`);

  const files = readBuiltFiles(inputDir);

  if (files.length === 0) {
    printError(`No files found in ${inputDir}. Run 'osdctl build' first.`);
    process.exitCode = 1;
    return;
  }

  // Apply variable substitution before sending to the server
  const variables = getResolvedVariables(config);
  const profileName = config.defaultProfile;
  const rawObjects = stampManagedBy(files.map((f) => f.object));
  const objects = rawObjects.map(
    (obj) => substituteVariables(obj, variables, profileName) as SavedObject
  );

  console.log(`Found ${objects.length} object(s) to apply.\n`);

  // List objects to be applied
  const rows = objects.map((obj) => [obj.type, obj.id, (obj.attributes as Record<string, unknown>).title as string || '']);
  printTable(['Type', 'ID', 'Title'], rows);

  // Interactive confirmation
  if (confirm && !dryRun) {
    const confirmed = await promptConfirmation('\nProceed with apply?');
    if (!confirmed) {
      console.log('Apply cancelled.');
      return;
    }
  }

  const profile = getActiveProfile(config);
  const client = new OsdClient(profile);

  let results: ApplyResult[];
  try {
    results = await client.bulkApply(objects, { dryRun });
  } catch (err: unknown) {
    const error = err as Error;
    printError(`Apply failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;

  for (const result of results) {
    switch (result.status) {
      case 'CREATED':
        printStatus('CREATED', `${result.type}/${result.id} (v${result.version})`, 'green');
        createdCount++;
        break;
      case 'UPDATED':
        printStatus('UPDATED', `${result.type}/${result.id} (v${result.version})`, 'yellow');
        updatedCount++;
        break;
      case 'UNCHANGED':
        printStatus('UNCHANGED', `${result.type}/${result.id}`, 'blue');
        unchangedCount++;
        break;
      case 'ERROR':
        printStatus('ERROR', `${result.type}/${result.id}: ${result.error}`, 'red');
        errorCount++;
        break;
    }
  }

  console.log(
    `\nSummary: ${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ${errorCount} errors`
  );

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}
