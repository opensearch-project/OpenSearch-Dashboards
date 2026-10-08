/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { AssetMigrationResultStep } from './asset_migration_result_step';
import { ASSET_TABLE_PAGE_SIZE, MigrationItem, MigrationSummary } from './types';

const makeFailures = (count: number, prefix: string): MigrationItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    type: i % 2 === 0 ? 'dashboard' : 'visualization',
    title: `${prefix} asset ${i}`,
    error: `error ${i}`,
  }));

const buildSummary = (overrides: Partial<MigrationSummary> = {}): MigrationSummary => ({
  associated: 0,
  failed: 0,
  dataSources: 0,
  failures: [],
  workspaceId: 'ws-1',
  workspaceName: 'Marketing',
  ...overrides,
});

const RETRY_HINT = /run the migration again to retry them/i;

const statTitles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.euiStat__title')).map((node) => node.textContent);

describe('AssetMigrationResultStep', () => {
  // The callout colour is the at-a-glance signal for the run's outcome, so each branch of the
  // failed/associated combination has to map to a distinct colour.
  describe('callout colour tracks the outcome', () => {
    it('is success when nothing failed', () => {
      const { container } = render(
        <AssetMigrationResultStep summary={buildSummary({ associated: 20, failed: 0 })} />
      );

      expect(container.querySelector('.euiCallOut--success')).toBeInTheDocument();
      expect(container.querySelector('.euiCallOut--warning')).toBeNull();
      expect(container.querySelector('.euiCallOut--danger')).toBeNull();
      expect(container.querySelector('.euiCallOutHeader__title')?.textContent).toBe(
        '20 assets are now available in Marketing'
      );
    });

    it('is warning when some succeeded and some failed', () => {
      const { container } = render(
        <AssetMigrationResultStep
          summary={buildSummary({ associated: 3, failed: 2, failures: makeFailures(2, 'fail') })}
        />
      );

      expect(container.querySelector('.euiCallOut--warning')).toBeInTheDocument();
      expect(container.querySelector('.euiCallOut--success')).toBeNull();
      expect(container.querySelector('.euiCallOut--danger')).toBeNull();
    });

    it('is danger with the "no assets migrated" title when none succeeded', () => {
      const { container } = render(
        <AssetMigrationResultStep
          summary={buildSummary({ associated: 0, failed: 20, failures: makeFailures(20, 'fail') })}
        />
      );

      expect(container.querySelector('.euiCallOut--danger')).toBeInTheDocument();
      expect(container.querySelector('.euiCallOut--success')).toBeNull();
      expect(container.querySelector('.euiCallOut--warning')).toBeNull();
      expect(screen.getByText('No assets were migrated')).toBeInTheDocument();
    });
  });

  it('renders the three EuiStat figures in migrated/failed/dataSources order', () => {
    const { container } = render(
      <AssetMigrationResultStep
        summary={buildSummary({
          associated: 20,
          failed: 5,
          dataSources: 4,
          failures: makeFailures(5, 'fail'),
        })}
      />
    );

    expect(statTitles(container)).toEqual(['20', '5', '4']);
    expect(screen.getByText('Assets migrated')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Data sources connected')).toBeInTheDocument();
  });

  // Successful assets are deliberately not listed: the table exists only for rows needing an action,
  // so with no failures there is nothing to retry and nothing to show.
  it('renders no failure table or retry hint when there are no failures', () => {
    render(<AssetMigrationResultStep summary={buildSummary({ associated: 20, failed: 0 })} />);

    expect(screen.queryByTestId('assetMigrationResultTable')).toBeNull();
    expect(screen.queryByText(RETRY_HINT)).toBeNull();
  });

  describe('failure table', () => {
    it('lists only failures with Asset, Type and the reason as readable text', () => {
      render(
        <AssetMigrationResultStep
          summary={buildSummary({
            associated: 1,
            failed: 1,
            failures: [{ id: 'e1', type: 'visualization', title: 'Broken viz', error: 'Boom!' }],
          })}
        />
      );

      const table = screen.getByTestId('assetMigrationResultTable');
      expect(within(table).getByText('Broken viz')).toBeInTheDocument();
      expect(within(table).getByText('visualization')).toBeInTheDocument();
      // The reason is a plain cell value now, not hidden behind an icon tooltip a reader must hover.
      expect(within(table).getByText('Boom!')).toBeInTheDocument();
    });

    /**
     * The table paginates its own items. A controlled table would render every row it is handed and
     * ignore the page, so the pager would be present but inert.
     */
    it('renders one page of rows at a time and can advance to the next', () => {
      render(
        <AssetMigrationResultStep
          summary={buildSummary({ failed: 11, failures: makeFailures(11, 'fail') })}
        />
      );

      const table = screen.getByTestId('assetMigrationResultTable');
      expect(within(table).getAllByRole('row')).toHaveLength(ASSET_TABLE_PAGE_SIZE + 1); // + header
      expect(within(table).queryByText('fail asset 10')).toBeNull();

      fireEvent.click(screen.getByLabelText('Page 2 of 2'));

      expect(within(table).getByText('fail asset 10')).toBeInTheDocument();
      expect(within(table).queryByText('fail asset 0')).toBeNull();
    });

    // A row with no reason must still read as a failure rather than an empty cell.
    it('falls back to "Error" when a failure carries no reason string', () => {
      render(
        <AssetMigrationResultStep
          summary={buildSummary({
            associated: 0,
            failed: 1,
            failures: [{ id: 'e1', type: 'dashboard', title: 'No reason' }],
          })}
        />
      );

      const table = screen.getByTestId('assetMigrationResultTable');
      expect(within(table).getByText('Error')).toBeInTheDocument();
    });

    /**
     * Every failure is listed, however many there are: the table paginates them, and the walk already
     * holds one entry per attempted asset, so bounding this list would save nothing.
     */
    it('lists every failure, paging through them all', () => {
      const total = 43;
      render(
        <AssetMigrationResultStep
          summary={buildSummary({ failed: total, failures: makeFailures(total, 'fail') })}
        />
      );

      const table = screen.getByTestId('assetMigrationResultTable');
      expect(screen.getByText(String(total))).toBeInTheDocument();

      const lastPage = Math.ceil(total / ASSET_TABLE_PAGE_SIZE);
      fireEvent.click(screen.getByLabelText(`Page ${lastPage} of ${lastPage}`));
      expect(within(table).getByText(`fail asset ${total - 1}`)).toBeInTheDocument();
    });

    it('shows the retry hint whenever there are failures', () => {
      render(
        <AssetMigrationResultStep
          summary={buildSummary({ associated: 3, failed: 2, failures: makeFailures(2, 'fail') })}
        />
      );

      expect(screen.getByText(RETRY_HINT)).toBeInTheDocument();
    });
  });
});
