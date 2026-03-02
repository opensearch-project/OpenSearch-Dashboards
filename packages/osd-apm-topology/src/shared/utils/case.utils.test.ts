/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { titleCaseToSentenceCase } from './case.utils';

describe('titleCaseToSentenceCase', () => {
  it('should convert basic PascalCase to sentence case', () => {
    expect(titleCaseToSentenceCase('LoadBalancer')).toBe('Load Balancer');
    expect(titleCaseToSentenceCase('TargetGroup')).toBe('Target Group');
    expect(titleCaseToSentenceCase('UserAccount')).toBe('User Account');
  });

  it('should handle consecutive uppercase letters correctly', () => {
    expect(titleCaseToSentenceCase('APIGateway')).toBe('API Gateway');
    expect(titleCaseToSentenceCase('HTTPServer')).toBe('HTTP Server');
    expect(titleCaseToSentenceCase('XMLParser')).toBe('XML Parser');
  });

  it('should keep acronyms intact', () => {
    expect(titleCaseToSentenceCase('AWS')).toBe('AWS');
    expect(titleCaseToSentenceCase('ECS')).toBe('ECS');
    expect(titleCaseToSentenceCase('IAM')).toBe('IAM');
  });

  it('should handle exceptions correctly', () => {
    expect(titleCaseToSentenceCase('CloudWatch', ['CloudWatch'])).toBe('CloudWatch');
    expect(titleCaseToSentenceCase('CloudWatchMetrics', ['CloudWatch'])).toBe('CloudWatch Metrics');
    expect(titleCaseToSentenceCase('DynamoDB', ['DynamoDB'])).toBe('DynamoDB');
  });

  it('should handle edge cases', () => {
    expect(titleCaseToSentenceCase('')).toBe('');
    expect(titleCaseToSentenceCase('A')).toBe('A');
    expect(titleCaseToSentenceCase('AB')).toBe('AB');
    expect(titleCaseToSentenceCase('abc')).toBe('abc');
  });

  it('should handle multiple exceptions', () => {
    expect(titleCaseToSentenceCase('CloudWatchLogsGroup', ['CloudWatch', 'LogsGroup'])).toBe(
      'CloudWatch LogsGroup'
    );
  });
});
