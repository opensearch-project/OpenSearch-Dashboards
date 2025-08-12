/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../common';
import { getCurrentFlavor, isTraceFlavor, isMetricsFlavor, isLogsFlavor } from './flavor_utils';

describe('flavor_utils', () => {
  describe('getCurrentFlavor', () => {
    it('should return Traces flavor for paths containing /traces', () => {
      expect(getCurrentFlavor('/app/explore/traces')).toBe(ExploreFlavor.Traces);
      expect(getCurrentFlavor('/w/workspace/app/explore/traces')).toBe(ExploreFlavor.Traces);
      expect(getCurrentFlavor('/app/explore/traces/123')).toBe(ExploreFlavor.Traces);
    });

    it('should return Traces flavor for paths containing /trace', () => {
      expect(getCurrentFlavor('/app/explore/trace')).toBe(ExploreFlavor.Traces);
      expect(getCurrentFlavor('/w/workspace/app/explore/trace/123')).toBe(ExploreFlavor.Traces);
    });

    it('should return Metrics flavor for paths containing /metrics', () => {
      expect(getCurrentFlavor('/app/explore/metrics')).toBe(ExploreFlavor.Metrics);
      expect(getCurrentFlavor('/w/workspace/app/explore/metrics')).toBe(ExploreFlavor.Metrics);
      expect(getCurrentFlavor('/app/explore/metrics/dashboard')).toBe(ExploreFlavor.Metrics);
    });

    it('should return Logs flavor for paths not containing traces or metrics', () => {
      expect(getCurrentFlavor('/app/explore')).toBe(ExploreFlavor.Logs);
      expect(getCurrentFlavor('/app/explore/logs')).toBe(ExploreFlavor.Logs);
      expect(getCurrentFlavor('/app/explore/discover')).toBe(ExploreFlavor.Logs);
      expect(getCurrentFlavor('/app/explore/some-other-path')).toBe(ExploreFlavor.Logs);
    });

    it('should handle empty strings', () => {
      expect(getCurrentFlavor('')).toBe(ExploreFlavor.Logs);
    });

    it('should handle paths with multiple occurrences', () => {
      expect(getCurrentFlavor('/traces/app/explore/metrics')).toBe(ExploreFlavor.Traces);
      expect(getCurrentFlavor('/metrics/app/explore/traces')).toBe(ExploreFlavor.Traces);
    });

    it('should be case sensitive', () => {
      expect(getCurrentFlavor('/app/explore/TRACES')).toBe(ExploreFlavor.Logs);
      expect(getCurrentFlavor('/app/explore/Traces')).toBe(ExploreFlavor.Logs);
    });
  });

  describe('isTraceFlavor', () => {
    it('should return true for trace paths', () => {
      expect(isTraceFlavor('/app/explore/traces')).toBe(true);
      expect(isTraceFlavor('/app/explore/trace')).toBe(true);
    });

    it('should return false for non-trace paths', () => {
      expect(isTraceFlavor('/app/explore/metrics')).toBe(false);
      expect(isTraceFlavor('/app/explore/logs')).toBe(false);
      expect(isTraceFlavor('/app/explore')).toBe(false);
    });
  });

  describe('isMetricsFlavor', () => {
    it('should return true for metrics paths', () => {
      expect(isMetricsFlavor('/app/explore/metrics')).toBe(true);
    });

    it('should return false for non-metrics paths', () => {
      expect(isMetricsFlavor('/app/explore/traces')).toBe(false);
      expect(isMetricsFlavor('/app/explore/logs')).toBe(false);
      expect(isMetricsFlavor('/app/explore')).toBe(false);
    });
  });

  describe('isLogsFlavor', () => {
    it('should return true for logs paths and default paths', () => {
      expect(isLogsFlavor('/app/explore/logs')).toBe(true);
      expect(isLogsFlavor('/app/explore')).toBe(true);
      expect(isLogsFlavor('/app/explore/discover')).toBe(true);
    });

    it('should return false for trace and metrics paths', () => {
      expect(isLogsFlavor('/app/explore/traces')).toBe(false);
      expect(isLogsFlavor('/app/explore/metrics')).toBe(false);
    });
  });
});
