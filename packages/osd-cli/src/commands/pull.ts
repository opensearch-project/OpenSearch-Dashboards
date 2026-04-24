/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { OsdClient, SavedObject } from '../client';
import { OsdctlConfig, getActiveProfile } from '../config';
import { printStatus, printHeader, printError, printSuccess } from '../utils/output';
import { toYaml } from '../utils/yaml';

export interface PullOptions {
  outputDir: string;
  outputFormat: 'json' | 'yaml';
  labels?: Record<string, string>;
  perPage?: number;
  config: OsdctlConfig;
}

/**
 * Parse label flag string into a record.
 * Format: "key1=value1,key2=value2"
 */
export function parseLabels(labelStr: string): Record<string, string> {
  const labels: Record<string, string> = {};
  const pairs = labelStr.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      labels[key.trim()] = value.trim();
    }
  }
  return labels;
}

/**
 * Generate a safe filename from type and id.
 */
function toFileName(obj: SavedObject, format: 'json' | 'yaml'): string {
  const safeName = `${obj.type}-${obj.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeName}.${format}`;
}

/**
 * Execute the pull command to export dashboards from an instance.
 */
export async function pullCommand(options: PullOptions): Promise<void> {
  const { outputDir, outputFormat, labels, perPage = 100, config } = options;

  printHeader('Pulling dashboards from instance');

  const profile = getActiveProfile(config);
  const client = new OsdClient(profile);

  let objects: SavedObject[];
  try {
    if (labels) {
      // Use exportClean when filtering by labels
      objects = await client.exportClean({ labels });
    } else {
      // Use paginated findAll for pulling all objects
      objects = await client.findAll('dashboard', perPage);
    }
  } catch (err: unknown) {
    const error = err as Error;
    printError(`Pull failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (objects.length === 0) {
    console.log('No objects found matching the criteria.');
    return;
  }

  // Ensure output directory exists
  const absOutputDir = path.resolve(outputDir);
  if (!fs.existsSync(absOutputDir)) {
    fs.mkdirSync(absOutputDir, { recursive: true });
  }

  for (const obj of objects) {
    const fileName = toFileName(obj, outputFormat);
    const filePath = path.join(absOutputDir, fileName);

    let content: string;
    if (outputFormat === 'json') {
      content = JSON.stringify(obj, null, 2) + '\n';
    } else {
      content = toYaml(obj);
    }

    fs.writeFileSync(filePath, content);
    printStatus('PULL', `${obj.type}/${obj.id} -> ${fileName}`, 'green');
  }

  printSuccess(`Pulled ${objects.length} object(s) to ${outputDir}/`);
}
