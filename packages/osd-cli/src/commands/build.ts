/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { printStatus, printHeader, printError, printSuccess } from '../utils/output';
import { toYaml } from '../utils/yaml';

export interface BuildOptions {
  file?: string;
  directory?: string;
  outputFormat: 'json' | 'yaml';
  outputDir: string;
  stdout: boolean;
}

/**
 * Get all TypeScript files in a directory recursively.
 */
function getTypeScriptFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getTypeScriptFiles(fullPath));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Build a single TypeScript file by executing it via npx tsx.
 * The file is expected to print JSON to stdout.
 */
function buildFile(filePath: string): unknown {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  try {
    const output = execFileSync('npx', ['tsx', absPath], {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: path.dirname(absPath),
    });

    return JSON.parse(output.trim());
  } catch (err: unknown) {
    const error = err as Error & { stderr?: string };
    throw new Error(
      `Failed to build ${filePath}: ${error.stderr || error.message}`
    );
  }
}

/**
 * Write a built object to the output directory.
 */
function writeOutput(
  data: unknown,
  sourcePath: string,
  outputDir: string,
  format: 'json' | 'yaml'
): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const ext = format === 'json' ? '.json' : '.yaml';
  const outputPath = path.join(outputDir, `${baseName}${ext}`);

  const content =
    format === 'json' ? JSON.stringify(data, null, 2) + '\n' : toYaml(data);

  fs.writeFileSync(outputPath, content);
  return outputPath;
}

/**
 * Execute the build command.
 */
export async function buildCommand(options: BuildOptions): Promise<void> {
  const { file, directory, outputFormat, outputDir, stdout } = options;

  if (!file && !directory) {
    printError('Either --file (-f) or --directory (-d) must be specified.');
    process.exitCode = 1;
    return;
  }

  const files: string[] = [];

  if (file) {
    files.push(path.resolve(file));
  }

  if (directory) {
    const dirPath = path.resolve(directory);
    if (!fs.existsSync(dirPath)) {
      printError(`Directory not found: ${dirPath}`);
      process.exitCode = 1;
      return;
    }
    files.push(...getTypeScriptFiles(dirPath));
  }

  if (files.length === 0) {
    printError('No TypeScript files found to build.');
    process.exitCode = 1;
    return;
  }

  if (!stdout) {
    printHeader('Building dashboard definitions');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    try {
      const data = buildFile(filePath);

      if (stdout) {
        const output =
          outputFormat === 'json'
            ? JSON.stringify(data, null, 2)
            : toYaml(data);
        process.stdout.write(output);
      } else {
        const outputPath = writeOutput(data, filePath, outputDir, outputFormat);
        printStatus('BUILT', `${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}`, 'green');
      }
      successCount++;
    } catch (err: unknown) {
      const error = err as Error;
      printError(`${path.relative(process.cwd(), filePath)}: ${error.message}`);
      errorCount++;
    }
  }

  if (!stdout) {
    console.log(`\nBuild complete: ${successCount} succeeded, ${errorCount} failed.`);
    if (errorCount > 0) {
      process.exitCode = 1;
    } else {
      printSuccess(`Output written to ${outputDir}/`);
    }
  }
}
