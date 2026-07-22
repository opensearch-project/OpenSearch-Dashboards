/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectAndSetOptimalTab } from './detect_optimal_tab';
import {
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_STATISTICS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../../../../../common';

jest.mock('../slices', () => ({
  setActiveTab: jest.fn((tabId) => ({ type: 'ui/setActiveTab', payload: tabId })),
}));

const mockServices = {} as any;

/**
 * Helper to build a minimal RootState-like object for getState().
 */
const buildState = (query: string, activeTabId: string) => ({
  query: { query },
  ui: { activeTabId },
});

/**
 * Invokes the thunk and returns the tab id that was dispatched via setActiveTab.
 */
const runDetect = async (query: string, activeTabId: string): Promise<string> => {
  const mockDispatch = jest.fn();
  const mockGetState = jest.fn().mockReturnValue(buildState(query, activeTabId));

  const thunk = detectAndSetOptimalTab({ services: mockServices });
  await thunk(mockDispatch, mockGetState, undefined);

  // setActiveTab is called inside the thunk via dispatch
  const setActiveTabCall = mockDispatch.mock.calls.find(
    (call) => call[0]?.type === 'ui/setActiveTab'
  );
  expect(setActiveTabCall).toBeDefined();
  return setActiveTabCall![0].payload;
};

describe('detectAndSetOptimalTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Rule 1: Current tab is Logs (default)
  // =========================================================================
  describe('Rule 1 — current tab is Logs', () => {
    it('switches to Statistics when query contains | stats', async () => {
      const tab = await runDetect('source = idx | stats count() by category', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('switches to Statistics when query contains | table', async () => {
      const tab = await runDetect('source = idx | table col1, col2', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('switches to Visualization when query contains | chart', async () => {
      const tab = await runDetect('source = idx | chart count() by cat', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('switches to Visualization when query contains | timechart', async () => {
      const tab = await runDetect('source = idx | timechart count()', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Logs when query has no special command', async () => {
      const tab = await runDetect('source = idx | where x > 1', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('stays on Logs when query is empty', async () => {
      const tab = await runDetect('', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });
  });

  // =========================================================================
  // Rule 2: Current tab is Statistic
  // =========================================================================
  describe('Rule 2 — current tab is Statistic', () => {
    it('stays on Statistics when query contains | stats', async () => {
      const tab = await runDetect(
        'source = idx | stats count() by category',
        EXPLORE_STATISTICS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('stays on Statistics when query contains | table', async () => {
      const tab = await runDetect('source = idx | table col1', EXPLORE_STATISTICS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('stays on Statistics when query contains | chart (interchangeable)', async () => {
      const tab = await runDetect('source = idx | chart count() by cat', EXPLORE_STATISTICS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('stays on Statistics when query contains | timechart (interchangeable)', async () => {
      const tab = await runDetect('source = idx | timechart count()', EXPLORE_STATISTICS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('switches to Logs when query has no special command', async () => {
      const tab = await runDetect('source = idx | where x > 1', EXPLORE_STATISTICS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('switches to Logs when query is empty', async () => {
      const tab = await runDetect('', EXPLORE_STATISTICS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });
  });

  // =========================================================================
  // Rule 3: Current tab is Visualization
  // =========================================================================
  describe('Rule 3 — current tab is Visualization', () => {
    it('stays on Visualization when query contains | stats (interchangeable)', async () => {
      const tab = await runDetect(
        'source = idx | stats count() by category',
        EXPLORE_VISUALIZATION_TAB_ID
      );
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Visualization when query contains | table (interchangeable)', async () => {
      const tab = await runDetect('source = idx | table col1', EXPLORE_VISUALIZATION_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Visualization when query contains | chart', async () => {
      const tab = await runDetect(
        'source = idx | chart count() by cat',
        EXPLORE_VISUALIZATION_TAB_ID
      );
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Visualization when query contains | timechart', async () => {
      const tab = await runDetect('source = idx | timechart count()', EXPLORE_VISUALIZATION_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Visualization when query has no special command', async () => {
      const tab = await runDetect('source = idx | where x > 1', EXPLORE_VISUALIZATION_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Visualization when query is empty', async () => {
      const tab = await runDetect('', EXPLORE_VISUALIZATION_TAB_ID);
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });
  });
});
