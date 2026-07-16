/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PPLAnalyzePanel } from './ppl_analyze_panel';

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
    },
    operator_tree: [
      {
        source: 'source=accounts | where age < 30',
        node_type: ['SearchFrom', 'WhereCommand'],
        estimated_rows: 5000,
        actual_rows: 3,
        actual_time_ms: '2.70 ms',
        is_pushed_down: true,
      },
      {
        source: 'eval full_name = firstname + " " + lastname | fields full_name, email, age',
        node_type: ['EvalCommand', 'FieldsCommand'],
        estimated_rows: 5000,
        actual_rows: 3,
        actual_time_ms: '0.11 ms',
        is_pushed_down: false,
      },
    ],
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

  describe('operator tree', () => {
    it('renders Execution Phase Profiling title', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('Execution Phase Profiling')).toBeInTheDocument();
    });

    it('renders pushed-down stage row', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/Pushed down to OpenSearch/i)).toBeInTheDocument();
    });

    it('renders coordinator stage rows', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText('EVAL')).toBeInTheDocument();
    });

    it('shows fallback callout when operator_tree is empty', () => {
      const result = {
        ...mockAnalyzeResult,
        response: { ...mockAnalyzeResult.response, operator_tree: [] },
      };
      render(<PPLAnalyzePanel analyzeResult={result} />);
      expect(screen.getByText('Execution Phase Profiling unavailable')).toBeInTheDocument();
    });

    it('expands stage on click to show operations sub-table', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      const expandButton = screen.getAllByRole('button')[0];
      fireEvent.click(expandButton);
      expect(screen.getByText('OPERATIONS IN THIS STAGE')).toBeInTheDocument();
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

    it('renders on data nodes time', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/On data nodes:/i)).toBeInTheDocument();
    });

    it('renders on coordinator time', () => {
      render(<PPLAnalyzePanel analyzeResult={mockAnalyzeResult} />);
      expect(screen.getByText(/On coordinator:/i)).toBeInTheDocument();
    });
  });
});
