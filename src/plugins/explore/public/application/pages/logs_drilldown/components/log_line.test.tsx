/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LogLine } from './log_line';

describe('LogLine', () => {
  it('renders timestamp + colored level chip + key=value body for a structured row', () => {
    render(
      <LogLine
        row={{ '@timestamp': '2026-07-10T14:22:01Z', level: 'ERROR', message: 'boom', svc: 'api' }}
        timeFieldName="@timestamp"
        severityField="level"
      />
    );
    // Level chip present + bucketed for coloring.
    expect(screen.getByTestId('logsExploreLogLine-level-error')).toHaveTextContent('ERROR');
    // Body has the non-time, non-level fields as key=value.
    const line = screen.getByTestId('logsExploreLogLine');
    expect(line).toHaveTextContent('message=boom');
    expect(line).toHaveTextContent('svc=api');
    // Timestamp shown (shortened to HH:MM:SS), and NOT duplicated into the key=value body.
    expect(line).toHaveTextContent('14:22:01');
    expect(line).not.toHaveTextContent('@timestamp=');
  });

  it('falls back to JSON when there are no non-time/level fields', () => {
    render(
      <LogLine
        row={{ '@timestamp': 'T', level: 'INFO' }}
        timeFieldName="@timestamp"
        severityField="level"
      />
    );
    // No extra fields → body is JSON of the whole row.
    expect(screen.getByTestId('logsExploreLogLine')).toHaveTextContent('"level":"INFO"');
  });

  it('applies the truncated modifier by default and drops it when expanded', () => {
    const { rerender } = render(<LogLine row={{ a: 1 }} />);
    expect(screen.getByTestId('logsExploreLogLine').className).toContain(
      'logsExploreLogLine--truncated'
    );
    rerender(<LogLine row={{ a: 1 }} truncated={false} />);
    expect(screen.getByTestId('logsExploreLogLine').className).not.toContain(
      'logsExploreLogLine--truncated'
    );
  });

  it('auto-detects the level field when no explicit severityField is passed', () => {
    // `severity` is in SEVERITY_FIELD_CANDIDATES → detected without an explicit prop.
    render(<LogLine row={{ severity: 'warning', msg: 'disk low' }} />);
    expect(screen.getByTestId('logsExploreLogLine-level-warn')).toHaveTextContent('WARNING');
  });

  it('renders no timestamp span when the time field is absent from the row', () => {
    const { container } = render(
      <LogLine row={{ level: 'INFO', msg: 'x' }} timeFieldName="@timestamp" severityField="level" />
    );
    expect(container.querySelector('.logsExploreLogLine__ts')).toBeNull();
  });

  it('renders no level chip when there is no severity value', () => {
    const { container } = render(<LogLine row={{ msg: 'no level here' }} />);
    expect(container.querySelector('.logsExploreLogLine__level')).toBeNull();
    expect(screen.getByTestId('logsExploreLogLine')).toHaveTextContent('msg=no level here');
  });

  it('stringifies nested object values in the key=value body', () => {
    render(<LogLine row={{ ctx: { user: 'ann', id: 7 } }} />);
    expect(screen.getByTestId('logsExploreLogLine')).toHaveTextContent('ctx={"user":"ann","id":7}');
  });

  it('shortens an ISO timestamp to HH:MM:SS.mmm', () => {
    render(
      <LogLine
        row={{ '@timestamp': '2026-07-10T14:22:01.123Z', level: 'INFO', a: 1 }}
        timeFieldName="@timestamp"
        severityField="level"
      />
    );
    expect(screen.getByTestId('logsExploreLogLine')).toHaveTextContent('14:22:01.123');
  });

  it('shows a non-ISO timestamp string as-is (no T-match)', () => {
    render(<LogLine row={{ '@timestamp': '1720621321000', a: 1 }} timeFieldName="@timestamp" />);
    expect(screen.getByTestId('logsExploreLogLine')).toHaveTextContent('1720621321000');
  });
});
