/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describeAliasError, ensureLookupField, pointLookupAlias } from './lookup_alias';
import { LookupFieldError } from './lookup_field_error';

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

  it('removes the alias from every index holding an importer-created binding', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'old-a': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'a' } } } } },
        'old-b': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'b' } } } } },
      },
    });

    await expect(pointLookupAlias(client, params)).resolves.toBe(true);

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

  it('treats a binding filtered on the .keyword subfield as importer-created', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'old-index': {
          aliases: { 'my-lookup': { filter: { term: { '__lookup.keyword': 'old' } } } },
        },
      },
    });

    await pointLookupAlias(client, params);

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: { actions: [{ remove: { index: 'old-index', alias: 'my-lookup' } }, addAction] },
    });
  });

  it('refuses to touch an alias the importer did not create (no lookup term filter)', async () => {
    // The identifier is free text, so it can collide with an unrelated, user-managed alias.
    // Removing that alias from its indices would silently break whatever relies on it.
    client.indices.getAlias.mockResolvedValue({
      body: { 'logs-2024': { aliases: { 'my-lookup': {} } } },
    });

    await expect(pointLookupAlias(client, params)).rejects.toThrow(
      'The name "my-lookup" is already used by an alias not managed by the importer. ' +
        'Choose another import identifier.'
    );
    expect(client.indices.updateAliases).not.toHaveBeenCalled();
  });

  it('refuses when ANY binding of the name is not importer-created, even alongside lookup ones', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: {
        'old-index': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'old' } } } } },
        'logs-2024': { aliases: { 'my-lookup': { filter: { term: { service: 'api' } } } } },
      },
    });

    await expect(pointLookupAlias(client, params)).rejects.toThrow(
      /already used by an alias not managed by the importer/
    );
    expect(client.indices.updateAliases).not.toHaveBeenCalled();
  });

  it('surfaces the collision through describeAliasError as a user-facing message', async () => {
    client.indices.getAlias.mockResolvedValue({
      body: { 'logs-2024': { aliases: { 'my-lookup': {} } } },
    });

    const error = await pointLookupAlias(client, params).catch((e) => e);
    expect(describeAliasError(error)).toBe(
      'The name "my-lookup" is already used by an alias not managed by the importer. ' +
        'Choose another import identifier.'
    );
  });

  it('builds the alias filter on filterField when given (e.g. __lookup.keyword)', async () => {
    client.indices.getAlias.mockRejectedValue(notFound());

    await pointLookupAlias(client, { ...params, filterField: '__lookup.keyword' });

    expect(client.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [
          {
            add: {
              index: 'new-index',
              alias: 'my-lookup',
              filter: { term: { '__lookup.keyword': 'uuid-new' } },
            },
          },
        ],
      },
    });
  });

  describe('keepExisting (partial imports)', () => {
    it('leaves an existing lookup binding untouched and reports it was not moved', async () => {
      client.indices.getAlias.mockResolvedValue({
        body: {
          'old-index': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'old' } } } } },
        },
      });

      await expect(pointLookupAlias(client, { ...params, keepExisting: true })).resolves.toBe(
        false
      );
      expect(client.indices.updateAliases).not.toHaveBeenCalled();
    });

    it('still creates the alias when no previous binding exists', async () => {
      client.indices.getAlias.mockRejectedValue(notFound());

      await expect(pointLookupAlias(client, { ...params, keepExisting: true })).resolves.toBe(true);
      expect(client.indices.updateAliases).toHaveBeenCalledWith({
        body: { actions: [addAction] },
      });
    });

    it('still rejects a collision with an alias the importer did not create', async () => {
      client.indices.getAlias.mockResolvedValue({
        body: { 'logs-2024': { aliases: { 'my-lookup': {} } } },
      });

      await expect(pointLookupAlias(client, { ...params, keepExisting: true })).rejects.toThrow(
        /not managed by the importer/
      );
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
      body: {
        'old-index': { aliases: { 'my-lookup': { filter: { term: { __lookup: 'old' } } } } },
        unrelated: { aliases: {} },
      },
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

describe('ensureLookupField', () => {
  let client: any;

  const mappingOf = (perIndex: Record<string, Record<string, unknown> | undefined>) => ({
    body: Object.fromEntries(
      Object.entries(perIndex).map(([index, lookup]) => [
        index,
        {
          mappings: { properties: { name: { type: 'text' }, ...(lookup && { __lookup: lookup }) } },
        },
      ])
    ),
  });

  beforeEach(() => {
    client = {
      indices: {
        getMapping: jest.fn(),
        putMapping: jest.fn().mockResolvedValue({}),
      },
    };
  });

  it('maps __lookup as keyword when the existing index does not have it yet', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: undefined }));

    await expect(ensureLookupField(client, 'idx', '__lookup')).resolves.toBe('__lookup');

    expect(client.indices.getMapping).toHaveBeenCalledWith({ index: 'idx' });
    expect(client.indices.putMapping).toHaveBeenCalledWith({
      index: 'idx',
      body: { properties: { __lookup: { type: 'keyword' } } },
    });
  });

  it('uses __lookup directly when it is already a keyword', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: { type: 'keyword' } }));

    await expect(ensureLookupField(client, 'idx', '__lookup')).resolves.toBe('__lookup');
    expect(client.indices.putMapping).not.toHaveBeenCalled();
  });

  it('filters on __lookup.keyword when __lookup was dynamically mapped as text', async () => {
    // Dynamic mapping of a string: text + a keyword subfield. A term filter on the analyzed text
    // field matches nothing, but the keyword subfield holds the exact uuid.
    client.indices.getMapping.mockResolvedValue(
      mappingOf({
        idx: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
      })
    );

    await expect(ensureLookupField(client, 'idx', '__lookup')).resolves.toBe('__lookup.keyword');
    expect(client.indices.putMapping).not.toHaveBeenCalled();
  });

  it('fails loudly when __lookup is text without a keyword subfield', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: { type: 'text' } }));

    const error = await ensureLookupField(client, 'idx', '__lookup').catch((e) => e);
    expect(error).toBeInstanceOf(LookupFieldError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/"__lookup" in index "idx" is mapped as "text"/);
    expect(error.message).toMatch(/Import without an import identifier, or into a new index/);
    expect(client.indices.putMapping).not.toHaveBeenCalled();
  });

  it('fails loudly when __lookup has a non-string type', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: { type: 'long' } }));

    await expect(ensureLookupField(client, 'idx', '__lookup')).rejects.toThrow(/mapped as "long"/);
  });

  it('maps every backing index when importing through an alias whose indices lack the field', async () => {
    client.indices.getMapping.mockResolvedValue(
      mappingOf({ 'idx-1': { type: 'keyword' }, 'idx-2': undefined })
    );

    await expect(ensureLookupField(client, 'my-alias', '__lookup')).resolves.toBe('__lookup');
    expect(client.indices.putMapping).toHaveBeenCalledWith({
      index: 'my-alias',
      body: { properties: { __lookup: { type: 'keyword' } } },
    });
  });

  it('fails loudly when backing indices disagree on the usable lookup field', async () => {
    client.indices.getMapping.mockResolvedValue(
      mappingOf({
        'idx-1': { type: 'keyword' },
        'idx-2': { type: 'text', fields: { keyword: { type: 'keyword' } } },
      })
    );

    await expect(ensureLookupField(client, 'my-alias', '__lookup')).rejects.toThrow(
      LookupFieldError
    );
  });

  it('still adds the keyword mapping when the mapping cannot be read', async () => {
    // put_mapping is the authority: it succeeds when the field is absent or already keyword and
    // rejects a conflicting existing type, which is reported below.
    client.indices.getMapping.mockRejectedValue(new Error('security_exception'));

    await expect(ensureLookupField(client, 'idx', '__lookup')).resolves.toBe('__lookup');
    expect(client.indices.putMapping).toHaveBeenCalled();
  });

  it('reports a denied put_mapping as an actionable 403', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: undefined }));
    client.indices.putMapping.mockRejectedValue(
      Object.assign(new Error('Response Error'), {
        meta: {
          statusCode: 403,
          body: { error: { type: 'security_exception', reason: 'no permissions' } },
        },
      })
    );

    const error = await ensureLookupField(client, 'idx', '__lookup').catch((e) => e);
    expect(error).toBeInstanceOf(LookupFieldError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/permission to update the mapping of index "idx"/);
    expect(error.message).toMatch(/indices:admin\/mapping\/put/);
  });

  it('reports a rejected put_mapping (type conflict) as a 400 with the OpenSearch reason', async () => {
    client.indices.getMapping.mockRejectedValue(new Error('unreadable'));
    client.indices.putMapping.mockRejectedValue(
      Object.assign(new Error('Response Error'), {
        meta: {
          statusCode: 400,
          body: {
            error: {
              type: 'illegal_argument_exception',
              reason: 'mapper [__lookup] cannot be changed from type [long] to [keyword]',
            },
          },
        },
      })
    );

    const error = await ensureLookupField(client, 'idx', '__lookup').catch((e) => e);
    expect(error).toBeInstanceOf(LookupFieldError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/cannot be changed from type \[long\] to \[keyword\]/);
  });

  it('propagates other put_mapping failures unchanged', async () => {
    client.indices.getMapping.mockResolvedValue(mappingOf({ idx: undefined }));
    client.indices.putMapping.mockRejectedValue(new Error('socket hang up'));

    const error = await ensureLookupField(client, 'idx', '__lookup').catch((e) => e);
    expect(error).not.toBeInstanceOf(LookupFieldError);
    expect(error.message).toBe('socket hang up');
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
