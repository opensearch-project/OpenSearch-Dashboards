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
import { patternsModeCache } from '../../../../../../data/public/ppl_settings/patterns_mode_cache';

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

    it('switches to Statistics when query contains | top', async () => {
      const tab = await runDetect('source = idx | top 10 category', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('switches to Statistics when query contains | rare', async () => {
      const tab = await runDetect('source = idx | rare 10 category', EXPLORE_LOGS_TAB_ID);
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

  // =========================================================================
  // Rule 4: commands inside quoted strings or subqueries must not route the tab
  // =========================================================================
  describe('Rule 4 — commands inside strings/subqueries are masked', () => {
    it('stays on Logs when | stats appears only inside a quoted string', async () => {
      const tab = await runDetect('source = idx | where msg="a | stats b"', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('stays on Logs when | chart appears only inside a quoted string', async () => {
      const tab = await runDetect('source = idx | where msg="a | chart b"', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('stays on Logs when | stats appears only inside a bracketed subquery', async () => {
      const tab = await runDetect(
        'source = idx | where id in [ source = other | stats count() ]',
        EXPLORE_LOGS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('still switches to Statistics for a real | stats after a masked one', async () => {
      const tab = await runDetect(
        'source = idx | where msg="| stats x" | stats count() by y',
        EXPLORE_LOGS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });
  });

  // =========================================================================
  // Rule 5: pivot commands and aggregation-mode patterns are routed like the
  // aggregations they are, so the Logs tab never shows their stripped query
  // =========================================================================
  describe('Rule 5 — pivot commands and aggregation-mode patterns', () => {
    const statisticsQueries = [
      ['transpose', 'source = idx | transpose'],
      ['xyseries', "source = idx | xyseries host status in ('200', '404') bytes"],
      ['patterns mode=aggregation', 'source = idx | patterns message mode=aggregation'],
      ['patterns mode = aggregation', 'source = idx | patterns message mode = aggregation'],
    ];

    it.each(statisticsQueries)(
      'switches from Logs to Statistics for %s',
      async (_command, query) => {
        expect(await runDetect(query, EXPLORE_LOGS_TAB_ID)).toBe(EXPLORE_STATISTICS_TAB_ID);
      }
    );

    it.each(statisticsQueries)('stays on Statistics for %s', async (_command, query) => {
      expect(await runDetect(query, EXPLORE_STATISTICS_TAB_ID)).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('switches from Logs to Visualization for timewrap', async () => {
      const tab = await runDetect(
        'source = idx | timechart span=1h count() | timewrap 1d',
        EXPLORE_LOGS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_VISUALIZATION_TAB_ID);
    });

    it('stays on Statistics for timewrap', async () => {
      const tab = await runDetect(
        'source = idx | timechart span=1h count() | timewrap 1d',
        EXPLORE_STATISTICS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('prefers Statistics when a pivot follows a chart command', async () => {
      const tab = await runDetect(
        'source = idx | timechart span=1h count() by host | transpose',
        EXPLORE_LOGS_TAB_ID
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it.each([
      ['bare patterns', 'source = idx | patterns message'],
      ['label-mode patterns', 'source = idx | patterns message mode=label'],
    ])('stays on Logs for %s (rows are still documents)', async (_command, query) => {
      expect(await runDetect(query, EXPLORE_LOGS_TAB_ID)).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('stays on Logs when transpose appears only inside a quoted string', async () => {
      const tab = await runDetect('source = idx | where msg = "| transpose"', EXPLORE_LOGS_TAB_ID);
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });
  });

  // =========================================================================
  // Rule 6: a patterns without mode= follows the cluster's default mode
  // (plugins.ppl.pattern.mode), which is fetched only for such queries
  // =========================================================================
  describe('Rule 6 — patterns without mode= follows the cluster default', () => {
    const runWithClusterMode = async (
      query: string,
      activeTabId: string,
      clusterMode: 'label' | 'aggregation'
    ) => {
      const http = {
        get: jest.fn().mockResolvedValue({ patternMode: clusterMode, patternModeMeasured: true }),
      };
      const mockDispatch = jest.fn();
      const mockGetState = jest.fn().mockReturnValue({
        query: { query, language: 'PPL', dataset: { dataSource: { id: 'ds-1' } } },
        ui: { activeTabId },
      });
      await detectAndSetOptimalTab({ services: { http } as any })(
        mockDispatch,
        mockGetState,
        undefined
      );
      const tab = mockDispatch.mock.calls.find((call) => call[0]?.type === 'ui/setActiveTab')?.[0]
        .payload;
      return { tab, http };
    };

    afterEach(() => {
      patternsModeCache.dispose();
    });

    it('switches from Logs to Statistics when the cluster default is aggregation', async () => {
      const { tab, http } = await runWithClusterMode(
        'source = idx | patterns message',
        EXPLORE_LOGS_TAB_ID,
        'aggregation'
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
      expect(http.get).toHaveBeenCalledWith(expect.any(String), {
        query: { dataSourceId: 'ds-1' },
      });
    });

    it('stays on Statistics when the cluster default is aggregation', async () => {
      const { tab } = await runWithClusterMode(
        'source = idx | patterns message',
        EXPLORE_STATISTICS_TAB_ID,
        'aggregation'
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
    });

    it('stays on Logs when the cluster default is label', async () => {
      const { tab } = await runWithClusterMode(
        'source = idx | patterns message',
        EXPLORE_LOGS_TAB_ID,
        'label'
      );
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
    });

    it('lets an explicit mode=label win over an aggregation default, without fetching', async () => {
      const { tab, http } = await runWithClusterMode(
        'source = idx | patterns message mode=label',
        EXPLORE_LOGS_TAB_ID,
        'aggregation'
      );
      expect(tab).toBe(EXPLORE_LOGS_TAB_ID);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('does not fetch the setting for queries without patterns', async () => {
      const { tab, http } = await runWithClusterMode(
        'source = idx | stats count() by host',
        EXPLORE_LOGS_TAB_ID,
        'aggregation'
      );
      expect(tab).toBe(EXPLORE_STATISTICS_TAB_ID);
      expect(http.get).not.toHaveBeenCalled();
    });
  });
});
