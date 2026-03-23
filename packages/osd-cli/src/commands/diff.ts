/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { OsdClient, DiffResult } from '../client';
import { OsdctlConfig, getActiveProfile } from '../config';
import { printStatus, printHeader, printError, renderDiff } from '../utils/output';
import { readBuiltFiles } from './validate';

export interface DiffOptions {
  inputDir: string;
  outputDir?: string;
  config: OsdctlConfig;
}

/**
 * Execute the diff command to compare local definitions against deployed versions.
 */
export async function diffCommand(options: DiffOptions): Promise<void> {
  const { inputDir, outputDir, config } = options;

  printHeader('Diffing local vs. deployed dashboards');

  const files = readBuiltFiles(inputDir);

  if (files.length === 0) {
    printError(`No files found in ${inputDir}. Run 'osdctl build' first.`);
    process.exitCode = 1;
    return;
  }

  const profile = getActiveProfile(config);
  const client = new OsdClient(profile);
  const objects = files.map((f) => f.object);

  let results: DiffResult[];
  try {
    results = await client.diff(objects);
  } catch (err: unknown) {
    const error = err as Error;
    printError(`Diff failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  // Create output directory for diff files if requested
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const fileName = path.basename(files[i].filePath);

    switch (result.status) {
      case 'NEW':
        printStatus('NEW', `${fileName} (${result.type}/${result.id})`, 'green');
        newCount++;
        break;
      case 'UPDATED':
        printStatus('UPDATED', `${fileName} (${result.type}/${result.id})`, 'yellow');
        if (result.diff) {
          console.log(renderDiff(result.diff));
        }
        updatedCount++;
        break;
      case 'UNCHANGED':
        printStatus('UNCHANGED', `${fileName} (${result.type}/${result.id})`, 'blue');
        unchangedCount++;
        break;
    }

    // Write diff files if output directory specified
    if (outputDir && result.diff) {
      const diffFilePath = path.join(
        outputDir,
        `${path.basename(fileName, path.extname(fileName))}.diff`
      );
      fs.writeFileSync(diffFilePath, result.diff);
    }
  }

  console.log(`\nSummary: ${newCount} new, ${updatedCount} updated, ${unchangedCount} unchanged`);
}
