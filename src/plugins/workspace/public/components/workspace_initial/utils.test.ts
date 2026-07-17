/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import {
  WorkspaceFilterCriteria,
  buildWorkspaceFilterCriteria,
  filterWorkspaces,
  getRecencyCutoff,
  getWorkspaceRole,
  getWorkspacesWithRecentMessage,
  isWorkspaceFilterActive,
  sortByRecentVisitedAndAlphabetical,
} from './utils';

describe('getWorkspacesWithRecentMessage', () => {
  const workspaces = [
    { id: 'workspace1', name: 'Workspace 1' },
    { id: 'workspace2', name: 'Workspace 2' },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add visited message and timestamp for recent workspaces', () => {
    const recentWorkspaces = [{ id: 'workspace1', timestamp: Date.now() }];

    jest.spyOn(recentWorkspaceManager, 'getRecentWorkspaces').mockReturnValue(recentWorkspaces);

    const result = getWorkspacesWithRecentMessage(workspaces);
    expect(result).toEqual([
      {
        id: 'workspace1',
        name: 'Workspace 1',
        accessTimeStamp: recentWorkspaces[0].timestamp,
        visitedMessage: `Viewed a few seconds ago`,
      },
      {
        id: 'workspace2',
        name: 'Workspace 2',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
    ]);
  });

  it('should add "Not visited recently" message for workspaces without recent activity', () => {
    // No recent workspaces in the mock return
    jest.spyOn(recentWorkspaceManager, 'getRecentWorkspaces').mockReturnValue([]);

    const result = getWorkspacesWithRecentMessage(workspaces);
    expect(result).toEqual([
      {
        id: 'workspace1',
        name: 'Workspace 1',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
      {
        id: 'workspace2',
        name: 'Workspace 2',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
    ]);
  });
});

describe('sortByRecentVisitedAndAlphabetical', () => {
  const recentTimestamp = moment().subtract(1, 'days').toDate().getTime();
  const olderTimestamp = moment().subtract(5, 'days').toDate().getTime();

  const workspace1 = { id: 'workspace1', name: 'Workspace 1', accessTimeStamp: recentTimestamp };
  const workspace2 = { id: 'workspace2', name: 'Workspace 2', accessTimeStamp: olderTimestamp };
  const workspace3 = { id: 'workspace3', name: 'Workspace 3', accessTimeStamp: undefined };
  const workspace4 = { id: 'workspace4', name: 'Workspace 4', accessTimeStamp: undefined };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort by accessTimeStamp in descending order', () => {
    const sorted = [workspace1, workspace2].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace1, workspace2]); // workspace1 has a more recent timestamp
  });

  it('should prioritize the workspace with accessTimeStamp over the one without', () => {
    let sorted = [workspace2, workspace3].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace2, workspace3]); // workspace2 has a timestamp, workspace3 does not

    sorted = [workspace3, workspace2].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace2, workspace3]); // workspace2 has a timestamp, workspace3 does not
  });

  it('should sort alphabetically by name if neither workspace has a timestamp', () => {
    const sorted = [workspace4, workspace3].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace3, workspace4]); // Sorted alphabetically by name
  });
});

describe('getWorkspaceRole', () => {
  it('returns owner when the owner flag is set', () => {
    expect(getWorkspaceRole({ id: 'a', name: 'A', owner: true })).toBe('owner');
  });

  it('returns readonly when the readonly flag is set', () => {
    expect(getWorkspaceRole({ id: 'a', name: 'A', readonly: true })).toBe('readonly');
  });

  it('returns readwrite when neither flag is set', () => {
    expect(getWorkspaceRole({ id: 'a', name: 'A' })).toBe('readwrite');
  });

  it('prioritizes owner over readonly', () => {
    expect(getWorkspaceRole({ id: 'a', name: 'A', owner: true, readonly: true })).toBe('owner');
  });
});

describe('getRecencyCutoff', () => {
  it('returns null for "all" (no recency filter)', () => {
    expect(getRecencyCutoff('all')).toBeNull();
  });

  it('returns calendar start-of-period timestamps', () => {
    expect(getRecencyCutoff('today')).toBe(moment().startOf('day').valueOf());
    expect(getRecencyCutoff('week')).toBe(moment().startOf('week').valueOf());
    expect(getRecencyCutoff('month')).toBe(moment().startOf('month').valueOf());
  });
});

describe('isWorkspaceFilterActive', () => {
  it('is false when all criteria are neutral', () => {
    expect(isWorkspaceFilterActive({ searchQuery: '', roles: [], recency: 'all' })).toBe(false);
  });

  it('treats a whitespace-only query as inactive', () => {
    expect(isWorkspaceFilterActive({ searchQuery: '   ', roles: [], recency: 'all' })).toBe(false);
  });

  it('is true when the search query is set', () => {
    expect(isWorkspaceFilterActive({ searchQuery: 'abc', roles: [], recency: 'all' })).toBe(true);
  });

  it('is true when a role is selected', () => {
    expect(isWorkspaceFilterActive({ searchQuery: '', roles: ['owner'], recency: 'all' })).toBe(
      true
    );
  });

  it('is true when recency is not "all"', () => {
    expect(isWorkspaceFilterActive({ searchQuery: '', roles: [], recency: 'today' })).toBe(true);
  });
});

describe('buildWorkspaceFilterCriteria', () => {
  it('maps roleFilter "all" to an empty roles array', () => {
    expect(
      buildWorkspaceFilterCriteria({ searchQuery: 'x', roleFilter: 'all', recency: 'week' })
    ).toEqual({ searchQuery: 'x', roles: [], recency: 'week' });
  });

  it('maps a specific roleFilter to a single-element roles array', () => {
    expect(
      buildWorkspaceFilterCriteria({ searchQuery: '', roleFilter: 'owner', recency: 'all' })
    ).toEqual({ searchQuery: '', roles: ['owner'], recency: 'all' });
  });
});

describe('filterWorkspaces', () => {
  const now = Date.now();
  const list = [
    // Admin (owner), visited just now
    { id: '1', name: 'Payments', owner: true, accessTimeStamp: now },
    // Read only, never visited
    { id: '2', name: 'Checkout Latency', readonly: true, accessTimeStamp: undefined },
    // Read and write, visited two months ago
    { id: '3', name: 'Ingestion', accessTimeStamp: moment().subtract(2, 'months').valueOf() },
  ];
  const neutral: WorkspaceFilterCriteria = { searchQuery: '', roles: [], recency: 'all' };
  const ids = (result: Array<{ id: string }>) => result.map((w) => w.id);

  it('returns all workspaces when no criteria are active', () => {
    expect(ids(filterWorkspaces(list, neutral))).toEqual(['1', '2', '3']);
  });

  it('filters by case-insensitive name substring', () => {
    expect(ids(filterWorkspaces(list, { ...neutral, searchQuery: 'lat' }))).toEqual(['2']);
  });

  it('trims the search query before matching', () => {
    expect(ids(filterWorkspaces(list, { ...neutral, searchQuery: '  payments ' }))).toEqual(['1']);
  });

  it('filters by a single role', () => {
    expect(ids(filterWorkspaces(list, { ...neutral, roles: ['readonly'] }))).toEqual(['2']);
  });

  it('filters by a set of roles (OR within roles)', () => {
    expect(ids(filterWorkspaces(list, { ...neutral, roles: ['owner', 'readwrite'] }))).toEqual([
      '1',
      '3',
    ]);
  });

  it('filters by recency and excludes items without an accessTimeStamp', () => {
    // "today" keeps only id 1 (visited now); id 2 (undefined) and id 3 (old) are excluded
    expect(ids(filterWorkspaces(list, { ...neutral, recency: 'today' }))).toEqual(['1']);
    // "month" still excludes id 2 (undefined) and id 3 (two months old)
    expect(ids(filterWorkspaces(list, { ...neutral, recency: 'month' }))).toEqual(['1']);
  });

  it('combines all criteria with AND', () => {
    expect(
      ids(filterWorkspaces(list, { searchQuery: 'payments', roles: ['owner'], recency: 'today' }))
    ).toEqual(['1']);
    expect(
      filterWorkspaces(list, { searchQuery: 'payments', roles: ['readonly'], recency: 'all' })
    ).toEqual([]);
  });
});
