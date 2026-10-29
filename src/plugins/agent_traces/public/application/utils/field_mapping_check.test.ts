/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createFieldMappingCheck, isFieldNotFound } from './field_mapping_check';

const dataset = { id: 'ds', title: 'spans-*', type: 'INDEX_PATTERN' } as any;
const unmapped = { body: { error: { details: "can't resolve Symbol(attributes.x)" } } };

describe('createFieldMappingCheck', () => {
  it('records a field as present when the probe query succeeds', async () => {
    const check = createFieldMappingCheck('`attributes.x`');
    const ppl = { executeQuery: jest.fn().mockResolvedValue({}) };

    await check.ensureChecked(ppl, dataset, 'source = spans-*');

    expect(ppl.executeQuery).toHaveBeenCalledWith(
      dataset,
      'source = spans-* | where isnotnull(`attributes.x`) | head 1'
    );
    expect(check.isPresent('ds')).toBe(true);
    expect(check.isMissing('ds')).toBe(false);
  });

  it('records a field as missing only when the field is reported not found', async () => {
    const check = createFieldMappingCheck('`attributes.x`');

    await check.ensureChecked(
      { executeQuery: jest.fn().mockRejectedValue(unmapped) },
      dataset,
      'source = spans-*'
    );

    expect(check.isMissing('ds')).toBe(true);
    expect(check.isPresent('ds')).toBe(false);
  });

  it('leaves the result unknown and retries after another failure', async () => {
    const check = createFieldMappingCheck('`attributes.x`');
    const ppl = {
      executeQuery: jest.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValue({}),
    };

    await check.ensureChecked(ppl, dataset, 'source = spans-*');
    expect(check.isMissing('ds')).toBe(false);
    expect(check.isPresent('ds')).toBe(false);

    await check.ensureChecked(ppl, dataset, 'source = spans-*');
    expect(ppl.executeQuery).toHaveBeenCalledTimes(2);
    expect(check.isPresent('ds')).toBe(true);
  });

  it('runs one probe per dataset at a time and reports it as checking', async () => {
    const check = createFieldMappingCheck('`attributes.x`');
    let resolve: () => void = () => {};
    const ppl = {
      executeQuery: jest.fn(
        () =>
          new Promise((r) => {
            resolve = () => r({});
          })
      ),
    };

    const first = check.ensureChecked(ppl, dataset, 'source = spans-*');
    const second = check.ensureChecked(ppl, dataset, 'source = spans-*');
    expect(check.isChecking('ds')).toBe(true);
    resolve();
    await Promise.all([first, second]);

    expect(ppl.executeQuery).toHaveBeenCalledTimes(1);
    expect(check.isChecking('ds')).toBe(false);
  });

  it('does not probe again within the cache period', async () => {
    const check = createFieldMappingCheck('`attributes.x`');
    const ppl = { executeQuery: jest.fn().mockResolvedValue({}) };

    await check.ensureChecked(ppl, dataset, 'source = spans-*');
    await check.ensureChecked(ppl, dataset, 'source = spans-*');

    expect(ppl.executeQuery).toHaveBeenCalledTimes(1);
  });

  it('ignores calls without a runner, dataset or source command', async () => {
    const check = createFieldMappingCheck('`attributes.x`');
    const ppl = { executeQuery: jest.fn() };

    await check.ensureChecked(undefined, dataset, 'source = spans-*');
    await check.ensureChecked(ppl, undefined, 'source = spans-*');
    await check.ensureChecked(ppl, dataset, '');

    expect(ppl.executeQuery).not.toHaveBeenCalled();
    expect(check.isChecking(undefined)).toBe(false);
    expect(check.isMissing(undefined)).toBe(false);
  });

  it('keeps separate results per check and clears them on reset', () => {
    const a = createFieldMappingCheck('`a`');
    const b = createFieldMappingCheck('`b`');

    a.setPresent('ds', false);
    expect(a.isMissing('ds')).toBe(true);
    expect(b.isMissing('ds')).toBe(false);

    a.reset();
    expect(a.isMissing('ds')).toBe(false);
  });
});

describe('isFieldNotFound', () => {
  it.each([
    ["can't resolve Symbol(attributes.x) in type env", true],
    ['FIELD_NOT_FOUND', true],
    ['Field [attributes.x] not found', true],
    ['Request timeout', false],
  ])('%s -> %s', (message, expected) => {
    expect(isFieldNotFound(new Error(message))).toBe(expected);
  });

  it('reads the error body', () => {
    expect(isFieldNotFound(unmapped)).toBe(true);
  });
});
