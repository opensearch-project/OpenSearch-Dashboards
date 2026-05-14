/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// jsdom does not implement ResizeObserver. Tests get a no-op stand-in here so
// component code that constructs a ResizeObserver doesn't throw on import.
// Tests that need to drive resize callbacks should override this with
// jest.spyOn(global, 'ResizeObserver').mockImplementation(...) -- see
// src/plugins/opensearch_dashboards_utils/public/resize_checker/resize_checker.test.ts
// for an example.

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

module.exports = ResizeObserver;
