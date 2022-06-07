/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { versionSatisfies, cleanVersion } from './version';
import expect from '@osd/expect';

describe('versionSatisfies', function () {
  it('returns false if versions are not strings', () => {
    // @ts-ignore to test wrong args
    expect(versionSatisfies('a')).to.eql(false);
    // @ts-ignore to test wrong args
    expect(versionSatisfies('a', 1.2)).to.eql(false);
    // @ts-ignore to test wrong args
    expect(versionSatisfies(1.2, 'a')).to.eql(false);
    // @ts-ignore to test wrong args
    expect(versionSatisfies(1.2, '1.2')).to.eql(false);
  });

  it('returns true if versions are exact match', () => {
    expect(versionSatisfies('3.14.159', '3.14.159')).to.eql(true);
  });
});

describe('cleanVersion', function () {
  it('should not alter non-matching strings', () => {
    const version = 'hello world';
    expect(cleanVersion(version)).to.eql(version);
  });

  it('should return the first major.minor.patch version', function () {
    const version = 'hello world 1.12.35.7 7.12.19';
    expect(cleanVersion(version)).to.eql('1.12.35');
  });
});
