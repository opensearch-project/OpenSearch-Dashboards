/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getProviderIcon } from './provider_icons.constants';

describe('getProviderIcon', () => {
  it('returns a string for anthropic', () => {
    expect(typeof getProviderIcon('anthropic')).toBe('string');
  });

  it('returns a string for openai', () => {
    expect(typeof getProviderIcon('openai')).toBe('string');
  });

  it('returns a string for aws_bedrock', () => {
    expect(typeof getProviderIcon('aws_bedrock')).toBe('string');
  });

  it('returns a string for aws.bedrock (dot notation)', () => {
    expect(typeof getProviderIcon('aws.bedrock')).toBe('string');
  });

  it('returns undefined for unknown provider', () => {
    expect(getProviderIcon('unknown_provider')).toBeUndefined();
  });

  it('returns undefined when provider is undefined', () => {
    expect(getProviderIcon(undefined)).toBeUndefined();
  });

  it('returns undefined when called with no argument', () => {
    expect(getProviderIcon()).toBeUndefined();
  });
});
