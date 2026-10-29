/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describeAliasError, pointLookupAlias } from './lookup_alias';

describe('pointLookupAlias', () => {
  let client: any;

  const params = {
    indexName: 'new-index',
    alias: 'my-lookup',
    lookupId: 'uuid-new',
    lookupField: '__lookup',
  };

  const addAction = {
    add: {
      index: 'new-index',
      alias: 'my-lookup',
      filter: { term: { __lookup: 'uuid-new' } },
    },
  };

  const notFound = () => Object.assign(new Error('alias [my-lookup] missing'), { statusCode: 404 });

  beforeEach(() => {
    client = {
      indices: {
        getAlias: jest.fn(),
        updateAliases: jest.fn().mockResolvedValue({}),
      },
    };
  });

  it('only adds the alias when it does not exist anywhere (getAlias 404)', async () => {
    client.indices.getAlias.mockRejectedValue(notFound());

    await pointLookupAlias(client, params);

    expect(client.indices.getAlias).toHaveBeenCalledWith({ name: 'my-lookup' });
    expect(client.indices.updateAliases).toHaveBeenCalledTimes(1);
    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: { actions: [addAction] },
    });
  });

  it('treats a 404 reported under meta.statusCode as "nowhere"', async () => {
    client.indices.getAlias.mockRejectedValue(
      Object.assign(new Error('missing'), { meta: { statusCode: 404 } })
    );

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: { actions: [addAction] },
    });
  });

  it('only adds the alias when getAlias returns an empty body', async () => {
    client.indices.getAlias.mockResolvedValue({ body: {} });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: { actions: [addAction] },
    });
  });

  it('removes the alias from another index and adds it to the new one in ONE atomic call', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'old-index': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'old' } } } } },
      },
    });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledTimes(1);
    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [{ remove: { index: 'old-index', alias: 'my-lookup' } }, addAction],
      },
    });
  });

  it('removes the alias from every index currently holding it', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'old-a': { aliases: { 'my-lookup': {} } },
        'old-b': { aliases: { 'my-lookup': {} } },
      },
    });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [
          { remove: { index: 'old-a', alias: 'my-lookup' } },
          { remove: { index: 'old-b', alias: 'my-lookup' } },
          addAction,
        ],
      },
    });
  });

  it('replaces the old filter when the alias already lives on the same index', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'new-index': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'old' } } } } },
      },
    });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [{ remove: { index: 'new-index', alias: 'my-lookup' } }, addAction],
      },
    });
  });

  it('ignores indices in the getAlias body that do not actually hold the alias', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: { 'old-index': { aliases: { 'my-lookup': {} } }, unrelated: { aliases: {} } },
    });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [{ remove: { index: 'old-index', alias: 'my-lookup' } }, addAction],
      },
    });
  });

  it('propagates non-404 getAlias errors without touching aliases', async () => {
    client.indices.getAlias.mockRejectedValue(
      Object.assign(new Error('security_exception'), { statusCode: 403 })
    );

    await expect(pointLookupAlias(client, params)).rejects.toThrow('security_exception');
    expect(client.indices.updateAliases).not.toHaveBeenCalled();
  });

  it('propagates updateAliases errors', async () => {
    client.indices.getAlias.mockRejectedValue(notFound());
    client.indices.updateAliases.mockRejectedValue(new Error('invalid_alias_name_exception'));

    await expect(pointLookupAlias(client, params)).rejects.toThrow('invalid_alias_name_exception');
  });
});

describe('describeAliasError', () => {
  const securityError = (reason: string) =>
    Object.assign(new Error('Response Error'), {
      meta: { statusCode: 403, body: { error: { type: 'security_exception', reason } } },
    });

  it('names the exact missing alias permission with a call to action on a 403', () => {
    const e = securityError(
      'no permissions for [indices:admin/aliases/get] and User [name=broken1, backend_roles=[], requestedTenant=null]'
    );
    expect(describeAliasError(e)).toBe(
      'You do not have permission to manage aliases (indices:admin/aliases/get). Try creating an index directly.'
    );
  });

  it('lists every denied action when several are reported', () => {
    const e = securityError(
      'no permissions for [indices:admin/aliases, indices:admin/aliases/get] and User [name=x]'
    );
    expect(describeAliasError(e)).toBe(
      'You do not have permission to manage aliases (indices:admin/aliases, indices:admin/aliases/get). Try creating an index directly.'
    );
  });

  it('falls back to a generic permission message when the 403 reason is unrecognized', () => {
    const e = securityError('something else');
    expect(describeAliasError(e)).toBe(
      'You do not have permission to manage aliases. Try creating an index directly.'
    );
  });

  it('detects a 403 reported as a top-level statusCode', () => {
    const e = Object.assign(new Error('security_exception'), { statusCode: 403 });
    expect(describeAliasError(e)).toBe(
      'You do not have permission to manage aliases. Try creating an index directly.'
    );
  });

  it('surfaces the OpenSearch reason for non-permission failures', () => {
    const e = Object.assign(new Error('Response Error'), {
      meta: {
        statusCode: 400,
        body: {
          error: {
            type: 'invalid_alias_name_exception',
            reason: 'an index exists with the same name as the alias',
          },
        },
      },
    });
    expect(describeAliasError(e)).toBe('an index exists with the same name as the alias');
  });

  it('falls back to the error message when there is no structured reason', () => {
    expect(describeAliasError(new Error('socket hang up'))).toBe('socket hang up');
  });
});
