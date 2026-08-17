/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PPLAnalyzePanel } from './ppl_analyze_panel';

// The panel renders the physical plan (profile.plan).
const mockAnalyzeResult = {
  query: 'source=accounts | where age < 30',
  response: {
    profile: {
      summary: { total_time_ms: 18.25 },
      phases: {
        analyze: { time_ms: 2.0 },
        optimize: { time_ms: 12.37 },
        execute: { time_ms: 3.68 },
        format: { time_ms: 0.19 },
      },
      plan: {
        node: 'EnumerableCalc',
        time_ms: 3.68,
        rows: 3,
        children: [
          {
            node: 'CalciteEnumerableIndexScan',
            time_ms: 2.7,
            rows: 3,
          },
        ],
      },
    },
    recommendations: [
      {
        serverity: 'INFO',
        rule: 'Bottleneck stage',
        message: '73% of time is in the *SearchFrom, WhereCommand* stage',
        affected_node: 'source=accounts | where age < 30',
        suggestion: 'Consider optimizing the SearchFrom, WhereCommand operation',
      },
    ],
  },
};

describe('PPLAnalyzePanel', () => {
  describe('TimingBar', () => {
    it('renders total query time', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      // Text is rendered across child nodes inside a <strong> — match on the container
      expect(
        screen.getByText(
          (_, el) =>
            el?.tagName === 'STRONG' && (el.textContent || '').includes('Query completed in')
        )
      ).toBeInTheDocument();
    });

    it('renders phase labels in the legend', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      // Use getAllByText since phase names may appear multiple times (legend + bar)
      expect(screen.getAllByText(/^Analyze\b/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^Optimize\b/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^Execute\b/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^Format\b/i).length).toBeGreaterThan(0);
    });
  });

  describe('close button', () => {
    it('does not render close button when onClose is not provided', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.queryByTestId('analyzeCloseButton')).not.toBeInTheDocument();
    });

    it('renders close button when onClose is provided', () => {
      const onClose = jest.fn();
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} onClose={onClose} />);
      expect(screen.getByTestId('analyzeCloseButton')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('analyzeCloseButton'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('physical plan (all queries)', () => {
    it('renders Execution Phase Profiling title', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('Execution Phase Profiling')).toBeInTheDocument();
    });

    it('renders physical-plan operator rows with convention prefixes stripped', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('Calc')).toBeInTheDocument();
      expect(screen.getByText('IndexScan')).toBeInTheDocument();
      // Undecorated names should not leak into the row labels.
      expect(screen.queryByText('EnumerableCalc')).not.toBeInTheDocument();
    });

    it('shows fallback callout when the plan is absent', () => {
      const result = {
        ...mockAnalyzeResult,
        response: {
          ...mockAnalyzeResult.response,
          profile: { ...mockAnalyzeResult.response.profile, plan: undefined },
        },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Execution Phase Profiling unavailable')).toBeInTheDocument();
    });

    it('expands a stage on click to show operator detail', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getByText('SOURCE NODES')).toBeInTheDocument();
    });
  });

  describe('physical plan (complex queries)', () => {
    // A complex query (e.g. JOIN) returns a nested physical plan under
    // profile.plan.
    const complexResult = {
      query:
        'source=test_data | join left=l right=r on l.city=r.city test_data | head 1 | fields city',
      response: {
        profile: {
          summary: { total_time_ms: 279.93 },
          phases: {
            analyze: { time_ms: 3.52 },
            optimize: { time_ms: 16.39 },
            execute: { time_ms: 259.53 },
            format: { time_ms: 0.38 },
          },
          plan: {
            node: 'EnumerableCalc',
            time_ms: 258.0,
            rows: 1,
            children: [
              {
                node: 'EnumerableMergeJoin',
                time_ms: 257.91,
                rows: 2,
                children: [
                  { node: 'CalciteEnumerableIndexScan', time_ms: 133.17, rows: 3 },
                  { node: 'CalciteEnumerableIndexScan', time_ms: 123.63, rows: 3 },
                ],
              },
            ],
          },
        },
      },
    };

    it('renders the physical plan waterfall with convention prefixes stripped', () => {
      render(<PPLAnalyzePanel analyzeResult={complexResult} />);
      expect(screen.getByText('Execution Phase Profiling')).toBeInTheDocument();
      // Convention tokens (Enumerable, Calcite, ...) are stripped for display.
      expect(screen.getByText('Calc')).toBeInTheDocument();
      expect(screen.getByText('MergeJoin')).toBeInTheDocument();
      expect(screen.getAllByText('IndexScan').length).toBe(2);
      // Undecorated names should not leak into the row labels.
      expect(screen.queryByText('EnumerableCalc')).not.toBeInTheDocument();
    });

    it('shows the full undecorated operator name when a node is expanded', () => {
      render(<PPLAnalyzePanel analyzeResult={complexResult} />);
      // First row (post-order) is a leaf index scan.
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getByText('CalciteEnumerableIndexScan')).toBeInTheDocument();
    });

    it('does not show the unavailable callout when a plan tree is present', () => {
      render(<PPLAnalyzePanel analyzeResult={complexResult} />);
      expect(screen.queryByText('Execution Phase Profiling unavailable')).not.toBeInTheDocument();
    });

    it('expands a physical plan node to show operator detail', () => {
      render(<PPLAnalyzePanel analyzeResult={complexResult} />);
      fireEvent.click(screen.getAllByRole('button')[0]);
      // TIME appears both as the column header and the detail label.
      expect(screen.getAllByText('TIME').length).toBeGreaterThan(1);
      expect(screen.queryByText('TIME (INCLUSIVE)')).not.toBeInTheDocument();
      expect(screen.getByText('SOURCE NODES')).toBeInTheDocument();
    });

    it('reports the operator count in the summary row', () => {
      render(<PPLAnalyzePanel analyzeResult={complexResult} />);
      expect(screen.getByText(/Operators:/i)).toBeInTheDocument();
    });

    it('still shows the unavailable callout when neither tree nor plan exists', () => {
      const result = {
        ...complexResult,
        response: {
          profile: { ...complexResult.response.profile, plan: undefined },
        },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Execution Phase Profiling unavailable')).toBeInTheDocument();
    });
  });

  describe('recommendations', () => {
    it('renders recommendation rule name', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('Bottleneck stage')).toBeInTheDocument();
    });

    it('renders recommendation severity', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('INFO')).toBeInTheDocument();
    });

    it('renders affected_node when present', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/source=accounts \| where age < 30/)).toBeInTheDocument();
    });

    it('does not render recommendations section when empty', () => {
      const result = {
        ...mockAnalyzeResult,
        response: { ...mockAnalyzeResult.response, recommendations: [] },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.queryByText('RECOMMENDATIONS')).not.toBeInTheDocument();
    });

    it('does not render recommendations section when undefined', () => {
      const result = {
        ...mockAnalyzeResult,
        response: { ...mockAnalyzeResult.response, recommendations: undefined },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.queryByText('RECOMMENDATIONS')).not.toBeInTheDocument();
    });

    it('renders string recommendations without throwing (backend List<String> shape)', () => {
      // The backend may return recommendations as bare strings rather than objects;
      // the panel must coerce them instead of calling String.split on a missing field.
      const result = {
        ...mockAnalyzeResult,
        response: {
          ...mockAnalyzeResult.response,
          recommendations: ['Consider adding a filter to reduce scanned rows.'],
        },
      };
      expect(() => render(<PPLAnalyzePanel analyzeResult={result} />)).not.toThrow();
      expect(
        screen.getByText('Consider adding a filter to reduce scanned rows.')
      ).toBeInTheDocument();
    });

    it('ignores malformed recommendation entries (null / number)', () => {
      const result = {
        ...mockAnalyzeResult,
        response: {
          ...mockAnalyzeResult.response,
          recommendations: [null, 42, { message: 'A valid one' }] as any,
        },
      };
      expect(() => render(<PPLAnalyzePanel analyzeResult={result} />)).not.toThrow();
      expect(screen.getByText('A valid one')).toBeInTheDocument();
    });
  });

  describe('recommendations filtering', () => {
    // Execute phase = 100 ms. In this plan the sort's self-time is
    // 50 - 48 = 2 ms (2% of execute, below the 5% floor) and the leaf scan's is
    // 48 ms (48%, above the floor).
    const buildResult = (recommendations: any[]) => ({
      query: 'source=accounts | sort age',
      response: {
        profile: {
          summary: { total_time_ms: 100 },
          phases: {
            analyze: { time_ms: 0 },
            optimize: { time_ms: 0 },
            execute: { time_ms: 100 },
            format: { time_ms: 0 },
          },
          plan: {
            node: 'EnumerableSort',
            time_ms: 50,
            rows: 3,
            children: [{ node: 'CalciteEnumerableIndexScan', time_ms: 48, rows: 100000 }],
          },
        },
        recommendations,
      },
    });

    it('drops recommendations for nodes below 5% of the execute phase', () => {
      const result = buildResult([
        {
          severity: 'WARNING',
          rule: 'Tiny sort rule',
          message: 'sort is small',
          affected_node: 'EnumerableSort', // 2% of execute -> dropped
        },
        {
          severity: 'WARNING',
          rule: 'Big scan rule',
          message: 'scan is large',
          affected_node: 'CalciteEnumerableIndexScan', // 48% of execute -> kept
        },
      ]);
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Big scan rule')).toBeInTheDocument();
      expect(screen.queryByText('Tiny sort rule')).not.toBeInTheDocument();
    });

    it('keeps recommendations whose affected_node is not a plan node', () => {
      // An unmatched affected_node can't be weighed, so it passes the share filter.
      const result = buildResult([
        {
          severity: 'INFO',
          rule: 'Phase-level rule',
          message: 'planning dominates',
          affected_node: 'source=accounts | sort age',
        },
      ]);
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Phase-level rule')).toBeInTheDocument();
    });

    it('shows at most three recommendations, most critical first', () => {
      const result = buildResult([
        { severity: 'INFO', rule: 'Info one', message: 'i1' },
        { severity: 'CRITICAL', rule: 'Crit one', message: 'c1' },
        { severity: 'INFO', rule: 'Info two', message: 'i2' },
        { severity: 'WARNING', rule: 'Warn one', message: 'w1' },
      ]);
      render(<PPLAnalyzePanel analyzeResult={result} />);
      // Top 3 by severity: CRITICAL, WARNING, then the first INFO; the second INFO drops.
      expect(screen.getByText('Crit one')).toBeInTheDocument();
      expect(screen.getByText('Warn one')).toBeInTheDocument();
      expect(screen.getByText('Info one')).toBeInTheDocument();
      expect(screen.queryByText('Info two')).not.toBeInTheDocument();
    });

    it('hides the section when every recommendation is filtered out', () => {
      const result = buildResult([
        {
          severity: 'WARNING',
          rule: 'Tiny sort rule',
          message: 'sort is small',
          affected_node: 'EnumerableSort',
        },
      ]);
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.queryByText('RECOMMENDATIONS')).not.toBeInTheDocument();
    });
  });

  describe('cache hit detection', () => {
    it('does not show cache callout when possibleCacheHit is false', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.queryByText('Possible cache hit detected')).not.toBeInTheDocument();
    });

    it('shows cache callout when possibleCacheHit is true', () => {
      const result = {
        ...mockAnalyzeResult,
        response: { ...mockAnalyzeResult.response, possibleCacheHit: true },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Possible cache hit detected')).toBeInTheDocument();
    });
  });

  describe('summary row', () => {
    it('renders total execution phase time', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/Total Execution Phase:/i)).toBeInTheDocument();
    });

    it('renders the operator count', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/Operators:/i)).toBeInTheDocument();
    });

    it('renders the result row count', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/Result:/i)).toBeInTheDocument();
    });
  });
});
