/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import stripAnsi from 'strip-ansi';
import { getLoggerStream, onFinished } from './log_reporter';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('getLoggerStream', () => {
  it('should log to stdout when the json config is set to false', async () => {
    const lines = [];
    const origWrite = process.stdout.write;
    process.stdout.write = (buffer) => {
      lines.push(stripAnsi(buffer.toString()).trim());
      return true;
    };

    const loggerStream = getLoggerStream({
      config: {
        json: false,
        dest: 'stdout',
        filter: {},
      },
      events: { log: '*' },
    });

    loggerStream.end({ event: 'log', tags: ['foo'], data: 'test data' });

    await sleep(500);

    process.stdout.write = origWrite;
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^log   \[[^\]]*\] \[foo\] test data$/);
  });

  it('should log to stdout when the json config is set to true', async () => {
    const lines = [];
    const origWrite = process.stdout.write;
    process.stdout.write = (buffer) => {
      lines.push(JSON.parse(buffer.toString().trim()));
      return true;
    };

    const loggerStream = getLoggerStream({
      config: {
        json: true,
        dest: 'stdout',
        filter: {},
      },
      events: { log: '*' },
    });

    loggerStream.end({ event: 'log', tags: ['foo'], data: 'test data' });

    await sleep(500);

    process.stdout.write = origWrite;
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatchObject({
      type: 'log',
      tags: ['foo'],
      message: 'test data',
    });
  });

  it('should log to custom file when the json config is set to false', async () => {
    const dir = os.tmpdir();
    const logfile = `dest-${Date.now()}.log`;
    const dest = path.join(dir, logfile);

    const loggerStream = getLoggerStream({
      config: {
        json: false,
        dest,
        filter: {},
      },
      events: { log: '*' },
    });

    loggerStream.end({ event: 'log', tags: ['foo'], data: 'test data' });

    await sleep(500);

    const lines = stripAnsi(fs.readFileSync(dest, { encoding: 'utf8' }))
      .trim()
      .split(os.EOL);
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^log   \[[^\]]*\] \[foo\] test data$/);
  });

  it('should log to custom file when the json config is set to true and ignoreEnospcError', async () => {
    const dir = os.tmpdir();
    const logfile = `dest-${Date.now()}.log`;
    const dest = path.join(dir, logfile);

    const loggerStream = getLoggerStream({
      config: {
        json: true,
        dest,
        ignoreEnospcError: true,
        filter: {},
      },
      events: { log: '*' },
    });

    loggerStream.end({ event: 'log', tags: ['foo'], data: 'test data' });

    await sleep(500);

    const lines = fs
      .readFileSync(dest, { encoding: 'utf8' })
      .trim()
      .split(os.EOL)
      .map((data) => JSON.parse(data));
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatchObject({
      type: 'log',
      tags: ['foo'],
      message: 'test data',
    });
  });

  it('should handle ENOSPC error when disk full', () => {
    const error = { code: 'ENOSPC', stack: 'Error stack trace' };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      onFinished(error);
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in logging pipeline:', 'Error stack trace');

    consoleErrorSpy.mockRestore();
  });

  it('should throw error for non-ENOSPC error', () => {
    const error = { message: 'non-ENOSPC error', code: 'OTHER', stack: 'Error stack trace' };

    expect(() => {
      onFinished(error);
    }).toThrowError('non-ENOSPC error');
  });
});
