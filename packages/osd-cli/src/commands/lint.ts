/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { SavedObject } from '../client';
import { LintRuleConfig, OsdctlConfig } from '../config';
import { printStatus, printHeader, printError } from '../utils/output';
import { readBuiltFiles } from './validate';

export interface LintOptions {
  inputDir: string;
  config: OsdctlConfig;
}

export interface LintMessage {
  level: 'WARN' | 'ERROR';
  rule: string;
  message: string;
}

/**
 * Run lint rules against a single saved object.
 */
export function lintObject(obj: SavedObject, rules: LintRuleConfig): LintMessage[] {
  const messages: LintMessage[] = [];

  // require-labels rule
  if (rules['require-labels']) {
    if (!obj.labels || Object.keys(obj.labels).length === 0) {
      messages.push({
        level: 'ERROR',
        rule: 'require-labels',
        message: 'Object must have at least one label',
      });
    } else if (Array.isArray(rules['require-labels'])) {
      for (const requiredLabel of rules['require-labels']) {
        if (!obj.labels[requiredLabel]) {
          messages.push({
            level: 'ERROR',
            rule: 'require-labels',
            message: `Missing required label: "${requiredLabel}"`,
          });
        }
      }
    }
  }

  // require-annotations rule
  if (rules['require-annotations']) {
    if (!obj.annotations || Object.keys(obj.annotations).length === 0) {
      messages.push({
        level: 'ERROR',
        rule: 'require-annotations',
        message: 'Object must have at least one annotation',
      });
    } else if (Array.isArray(rules['require-annotations'])) {
      for (const requiredAnnotation of rules['require-annotations']) {
        if (!obj.annotations[requiredAnnotation]) {
          messages.push({
            level: 'ERROR',
            rule: 'require-annotations',
            message: `Missing required annotation: "${requiredAnnotation}"`,
          });
        }
      }
    }
  }

  // require-description rule
  if (rules['require-description']) {
    const attrs = obj.attributes as Record<string, unknown>;
    if (!attrs || !attrs.description || (typeof attrs.description === 'string' && attrs.description.trim() === '')) {
      messages.push({
        level: 'WARN',
        rule: 'require-description',
        message: 'Object should have a description in attributes',
      });
    }
  }

  // max-panels rule
  if (rules['max-panels'] !== undefined) {
    const attrs = obj.attributes as Record<string, unknown>;
    if (attrs && Array.isArray(attrs.panels)) {
      if (attrs.panels.length > rules['max-panels']) {
        messages.push({
          level: 'ERROR',
          rule: 'max-panels',
          message: `Dashboard has ${attrs.panels.length} panels, exceeding maximum of ${rules['max-panels']}`,
        });
      }
    }
  }

  // naming-convention rule
  if (rules['naming-convention']) {
    const pattern = new RegExp(rules['naming-convention']);
    if (!pattern.test(obj.id)) {
      messages.push({
        level: 'WARN',
        rule: 'naming-convention',
        message: `Object id "${obj.id}" does not match naming convention: ${rules['naming-convention']}`,
      });
    }
  }

  return messages;
}

/**
 * Execute the lint command.
 */
export async function lintCommand(options: LintOptions): Promise<void> {
  const { inputDir, config } = options;

  printHeader('Linting dashboard definitions');

  const rules = config.lint;
  if (!rules || Object.keys(rules).length === 0) {
    console.log('No lint rules configured. Add lint rules to .osdctl.yaml');
    return;
  }

  const files = readBuiltFiles(inputDir);

  if (files.length === 0) {
    printError(`No files found in ${inputDir}. Run 'osdctl build' first.`);
    process.exitCode = 1;
    return;
  }

  let totalWarns = 0;
  let totalErrors = 0;

  for (const { filePath, object } of files) {
    const fileName = path.basename(filePath);
    const messages = lintObject(object, rules);

    if (messages.length === 0) {
      printStatus('PASS', fileName, 'green');
      continue;
    }

    for (const msg of messages) {
      if (msg.level === 'ERROR') {
        printStatus('ERROR', `${fileName}: [${msg.rule}] ${msg.message}`, 'red');
        totalErrors++;
      } else {
        printStatus('WARN', `${fileName}: [${msg.rule}] ${msg.message}`, 'yellow');
        totalWarns++;
      }
    }
  }

  console.log(`\nLint complete: ${totalErrors} error(s), ${totalWarns} warning(s)`);

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}
