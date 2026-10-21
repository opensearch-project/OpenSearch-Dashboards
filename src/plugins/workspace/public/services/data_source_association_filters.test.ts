/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceConnection, DataSourceConnectionType } from '../../common/types';
import {
  DataSourceAssociationFilters,
  getDataSourceAssociationFilters,
} from './data_source_association_filters';

const connection: DataSourceConnection = {
  id: 'dc-1',
  name: 'example-connection',
  type: 'example-direct-query',
  connectionType: DataSourceConnectionType.DataConnection,
  attributes: { owner: 'example-plugin' },
};

const dataSource: DataSourceConnection = {
  id: 'ds-1',
  name: 'example-data-source',
  type: 'OpenSearch',
  connectionType: DataSourceConnectionType.OpenSearchConnection,
  relatedConnections: [],
  attributes: { owner: 'example-plugin' },
};

const observability = { useCaseId: 'observability', features: ['use-case-observability'] };
const search = { useCaseId: 'search', features: ['use-case-search'] };

describe('DataSourceAssociationFilters', () => {
  it('allows every connection when no filter is registered', () => {
    const filters = new DataSourceAssociationFilters();
    expect(filters.isAssociable(connection, {})).toBe(true);
    expect(filters.getRequestedFields()).toEqual([]);
  });

  it('passes a narrow candidate and the workspace context to every filter', () => {
    const filters = new DataSourceAssociationFilters();
    const allowObservabilityOnly = jest.fn((_candidate, context) => {
      return context.useCaseId === 'observability';
    });
    filters.register({ isAssociable: allowObservabilityOnly });
    filters.register({ isAssociable: () => true });

    expect(filters.isAssociable(connection, observability)).toBe(true);
    expect(filters.isAssociable(connection, search)).toBe(false);
    expect(filters.isAssociable(connection, {})).toBe(false);
    expect(allowObservabilityOnly).toHaveBeenCalledWith(
      {
        id: 'dc-1',
        savedObjectType: 'data-connection',
        connectionType: 'example-direct-query',
        attributes: { owner: 'example-plugin' },
      },
      search
    );
  });

  it('maps an OpenSearch data source to a data-source candidate', () => {
    const filters = new DataSourceAssociationFilters();
    const isAssociable = jest.fn(() => true);
    filters.register({ isAssociable });
    filters.isAssociable(dataSource, search);
    expect(isAssociable).toHaveBeenCalledWith(
      {
        id: 'ds-1',
        savedObjectType: 'data-source',
        connectionType: 'OpenSearch',
        attributes: { owner: 'example-plugin' },
      },
      search
    );
  });

  it('gives filters empty attributes when none were loaded', () => {
    const filters = new DataSourceAssociationFilters();
    const isAssociable = jest.fn(() => true);
    filters.register({ isAssociable });
    const { attributes: _attributes, ...withoutAttributes } = connection;
    filters.isAssociable(withoutAttributes, search);
    expect(isAssociable).toHaveBeenCalledWith(expect.objectContaining({ attributes: {} }), search);
  });

  it('does not ask filters about direct query connections of a data source', () => {
    const filters = new DataSourceAssociationFilters();
    const isAssociable = jest.fn(() => false);
    filters.register({ isAssociable });
    expect(
      filters.isAssociable(
        {
          id: 'ds-1-s3',
          name: 's3',
          type: 'S3GLUE',
          parentId: 'ds-1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
        },
        search
      )
    ).toBe(true);
    expect(isAssociable).not.toHaveBeenCalled();
  });

  it('lets a filter decide from the saved object attributes it requested', () => {
    const filters = new DataSourceAssociationFilters();
    filters.register({
      fields: ['owner'],
      isAssociable: (candidate, context) =>
        candidate.attributes.owner !== 'example-plugin' || context.useCaseId === 'search',
    });
    expect(filters.isAssociable(connection, search)).toBe(true);
    expect(filters.isAssociable(connection, observability)).toBe(false);
    expect(filters.isAssociable({ ...connection, attributes: {} }, observability)).toBe(true);
  });

  it('collects the requested fields of every filter once', () => {
    const filters = new DataSourceAssociationFilters();
    filters.register({ fields: ['owner', 'kind'], isAssociable: () => true });
    filters.register({ fields: ['kind'], isAssociable: () => true });
    filters.register({ isAssociable: () => true });
    expect(filters.getRequestedFields()).toEqual(['owner', 'kind']);
  });

  it('hides a connection when a filter throws, and warns once per filter with its id', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const filters = new DataSourceAssociationFilters();
      const error = new Error('boom');
      filters.register({
        id: 'example-plugin',
        isAssociable: () => {
          throw error;
        },
      });
      expect(filters.isAssociable(connection, observability)).toBe(false);
      expect(filters.isAssociable({ ...connection, id: 'dc-2' }, {})).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain("'example-plugin'");
      expect(warn.mock.calls[0][1]).toBe(error);
    } finally {
      warn.mockRestore();
    }
  });

  it('warns without a name for a filter without an id', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const filters = new DataSourceAssociationFilters();
      filters.register({
        isAssociable: () => {
          throw new Error('boom');
        },
      });
      filters.isAssociable(connection, {});
      expect(warn.mock.calls[0][0]).toBe(
        'The data source association filter threw; the connections it was asked about are hidden.'
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('does not let a filter change the connection it was asked about', () => {
    const filters = new DataSourceAssociationFilters();
    filters.register({
      isAssociable: (candidate) => {
        (candidate.attributes as Record<string, unknown>).owner = 'changed';
        return true;
      },
    });
    filters.isAssociable(connection, {});
    expect(connection.attributes).toEqual({ owner: 'example-plugin' });
  });

  it('keeps registrations per instance', () => {
    const first = new DataSourceAssociationFilters();
    const second = new DataSourceAssociationFilters();
    first.register({ fields: ['owner'], isAssociable: () => false });
    expect(first.isAssociable(connection, {})).toBe(false);
    expect(second.isAssociable(connection, {})).toBe(true);
    expect(second.getRequestedFields()).toEqual([]);
  });
});

describe('getDataSourceAssociationFilters', () => {
  it("returns the workspace client's filters", () => {
    const filters = new DataSourceAssociationFilters();
    expect(
      getDataSourceAssociationFilters({ getDataSourceAssociationFilters: () => filters } as any)
    ).toBe(filters);
  });

  it('returns undefined for a client without them', () => {
    expect(getDataSourceAssociationFilters({} as any)).toBeUndefined();
    expect(getDataSourceAssociationFilters(null)).toBeUndefined();
    expect(getDataSourceAssociationFilters(undefined)).toBeUndefined();
  });
});
