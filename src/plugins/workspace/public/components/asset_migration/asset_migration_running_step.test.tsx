/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { AssetMigrationRunningStep } from './asset_migration_running_step';
import { CreatedWorkspace, MigrationProgress } from './types';

const createdWorkspace: CreatedWorkspace = {
  id: 'ws-1',
  name: 'Marketing',
  dataSourceCount: 2,
};

const progress = (overrides: Partial<MigrationProgress> = {}): MigrationProgress => ({
  migrated: 0,
  failed: 0,
  estimatedTotal: 0,
  ...overrides,
});

describe('AssetMigrationRunningStep', () => {
  it('renders the running-step container', () => {
    render(<AssetMigrationRunningStep workspaceName="Marketing" />);
    expect(screen.getByTestId('assetMigrationRunningStep')).toBeInTheDocument();
  });

  describe('step one - create the workspace', () => {
    it('shows a spinner and "Creating workspace <name>..." (trimmed) before it exists', () => {
      const { container } = render(<AssetMigrationRunningStep workspaceName="  Marketing  " />);
      const step = screen.getByTestId('assetMigrationRunningStep');

      expect(step.textContent).toContain('Creating workspace Marketing...');
      expect(container.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
      // No success mark until the workspace is actually created.
      expect(container.querySelector('[data-euiicon-type="checkInCircleFilled"]')).toBeNull();
    });

    it('shows a check mark and "Workspace <name> created" once it exists', () => {
      const { container } = render(
        <AssetMigrationRunningStep workspaceName="Marketing" createdWorkspace={createdWorkspace} />
      );
      const step = screen.getByTestId('assetMigrationRunningStep');

      expect(step.textContent).toContain('Workspace Marketing created');
      expect(
        container.querySelector('[data-euiicon-type="checkInCircleFilled"]')
      ).toBeInTheDocument();
    });
  });

  describe('step two - progress', () => {
    /**
     * The denominator only exists once the run has counted the assets. Until then the second line
     * must stay indeterminate rather than invent a total or a filled bar.
     */
    it('shows the indeterminate copy and no progress bar while there is no estimate', () => {
      const { rerender } = render(<AssetMigrationRunningStep workspaceName="Marketing" />);
      expect(screen.getByTestId('assetMigrationProgressLabel').textContent).toBe(
        'Migrating assets...'
      );
      expect(screen.queryByTestId('assetMigrationProgressBar')).not.toBeInTheDocument();

      // A progress object that has not yet counted (estimatedTotal 0) is still indeterminate.
      rerender(
        <AssetMigrationRunningStep
          workspaceName="Marketing"
          createdWorkspace={createdWorkspace}
          progress={progress({ estimatedTotal: 0 })}
        />
      );
      expect(screen.getByTestId('assetMigrationProgressLabel').textContent).toBe(
        'Migrating assets...'
      );
      expect(screen.queryByTestId('assetMigrationProgressBar')).not.toBeInTheDocument();
    });

    it('shows the labelled bar once an estimate is known, counting migrated plus failed', () => {
      render(
        <AssetMigrationRunningStep
          workspaceName="Marketing"
          createdWorkspace={createdWorkspace}
          progress={progress({ migrated: 3, failed: 1, estimatedTotal: 12 })}
        />
      );

      // done = migrated + failed = 4.
      expect(screen.getByTestId('assetMigrationProgressLabel').textContent).toContain(
        'Migrated 4 of about 12 assets...'
      );
      const bar = screen.getByTestId('assetMigrationProgressBar');
      expect(bar.getAttribute('value')).toBe('4');
      expect(bar.getAttribute('max')).toBe('12');
    });

    it('caps the bar value at the estimate when the run outruns it', () => {
      render(
        <AssetMigrationRunningStep
          workspaceName="Marketing"
          createdWorkspace={createdWorkspace}
          progress={progress({ migrated: 30, failed: 0, estimatedTotal: 12 })}
        />
      );
      // Assets created mid-run can push done past the starting estimate; the bar must not overflow.
      expect(screen.getByTestId('assetMigrationProgressBar').getAttribute('value')).toBe('12');
    });
  });

  describe('refused dismissal', () => {
    it('says nothing about dismissal by default', () => {
      render(<AssetMigrationRunningStep workspaceName="Marketing" />);
      expect(screen.queryByTestId('assetMigrationDismissBlocked')).not.toBeInTheDocument();
    });

    /**
     * A run cannot be abandoned and `EuiModal` gives no way to hide its dismiss button from a plugin,
     * so the refusal is explained here rather than ignored silently.
     */
    it('explains the refusal once a dismissal was attempted', () => {
      render(<AssetMigrationRunningStep workspaceName="Marketing" dismissBlocked />);
      expect(screen.getByTestId('assetMigrationDismissBlocked').textContent).toContain(
        'cannot be cancelled'
      );
    });
  });
});
