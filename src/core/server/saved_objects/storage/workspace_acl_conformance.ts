/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISavedObjectsRepository } from '../service/lib/repository';

/**
 * Executable specification for the workspace / object-ACL filtering contract that
 * every `ISavedObjectsRepository` implementation must satisfy.
 *
 * `SavedObjectsFindOptions.workspaces` and `.ACLSearchParams` are typed as optional,
 * but when the workspace saved-objects client wrapper sets them they are the *only*
 * authorization applied -- the wrapper does no post-filtering. An implementation that
 * treats them as optional query refinements rather than as mandatory authorization
 * returns other tenants' objects. Optional types cannot express that obligation, so
 * it is expressed here instead.
 *
 * The semantics below are taken from the OpenSearch implementation in
 * `service/lib/search_dsl/query_params.ts`, which is the reference:
 *
 *   - the ACL clause, when `permissionModes` and `principals` are both present, is
 *     collected into a `should` array;
 *   - `workspaces` of length 0 contributes `match_none`;
 *   - with `workspacesSearchOperator: 'OR'` the workspace clause joins that same
 *     `should` array (union with the ACL clause); otherwise it is added to the
 *     `filter` array (intersection).
 *
 * The two cases most easily got wrong are 'empty workspace list' -- which must not
 * mean "no filter" -- and the difference between the OR and AND combinations. Note
 * that an empty workspace list does *not* universally mean "return nothing": under
 * `'OR'` the ACL clause still applies, so a user who belongs to no workspace must
 * still receive the objects their own ACL grants.
 *
 * Scope: workspace and object-ACL filtering only. Namespace-based multi-tenancy
 * (`typeToNamespacesMap`, namespace-agnostic types) is a separate axis and is not
 * covered here.
 */
export interface WorkspaceAclConformanceSuiteOptions {
  /** Label for the implementation under test, used in the describe block. */
  name: string;
  /** Must return a repository backed by empty, isolated storage on every call. */
  createRepository: () => Promise<ISavedObjectsRepository> | ISavedObjectsRepository;
}

const TYPE = 'dashboard';

export const describeWorkspaceAclConformance = ({
  name,
  createRepository,
}: WorkspaceAclConformanceSuiteOptions) => {
  describe(`${name} workspace/ACL filtering conformance`, () => {
    let repo: ISavedObjectsRepository;

    // `alice` is the caller in every case below. `bob` is a second principal whose
    // objects must never leak to her.
    const alicePrincipals = { users: ['alice'], groups: ['eng'] };

    const seed = async () => {
      // In a workspace alice can reach, no object ACL.
      await repo.create(TYPE, { title: 'in-ws-a' }, { id: 'in-ws-a', workspaces: ['ws-a'] });
      // In a workspace alice cannot reach, no object ACL.
      await repo.create(TYPE, { title: 'in-ws-b' }, { id: 'in-ws-b', workspaces: ['ws-b'] });
      // No workspace, ACL grants alice read.
      await repo.create(
        TYPE,
        { title: 'acl-alice' },
        { id: 'acl-alice', permissions: { read: { users: ['alice'] } } }
      );
      // No workspace, ACL grants only bob.
      await repo.create(
        TYPE,
        { title: 'acl-bob' },
        { id: 'acl-bob', permissions: { read: { users: ['bob'] } } }
      );
      // No workspace, ACL grants alice's group.
      await repo.create(
        TYPE,
        { title: 'acl-group' },
        { id: 'acl-group', permissions: { read: { groups: ['eng'] } } }
      );
      // No workspace, ACL wildcard -- readable by everyone.
      await repo.create(
        TYPE,
        { title: 'acl-star' },
        { id: 'acl-star', permissions: { read: { users: ['*'] } } }
      );
      // Neither workspace nor ACL: reachable only when no tenancy constraint is given.
      await repo.create(TYPE, { title: 'bare' }, { id: 'bare' });
    };

    const idsFrom = async (options: Record<string, unknown>) => {
      const result = await repo.find({ type: TYPE, perPage: 100, ...options } as Parameters<
        typeof repo.find
      >[0]);
      return result.saved_objects.map((o) => o.id).sort();
    };

    beforeEach(async () => {
      repo = await createRepository();
      await seed();
    });

    it('applies no tenancy constraint when neither option is supplied', async () => {
      await expect(idsFrom({})).resolves.toEqual(
        ['acl-alice', 'acl-bob', 'acl-group', 'acl-star', 'bare', 'in-ws-a', 'in-ws-b'].sort()
      );
    });

    it('returns only objects in the listed workspaces', async () => {
      await expect(idsFrom({ workspaces: ['ws-a'] })).resolves.toEqual(['in-ws-a']);
    });

    // The critical case. An empty permitted-workspace list is what the wrapper produces
    // for a caller who belongs to no workspace, and for a caller whose requested
    // workspace id was filtered out as not permitted. It must never mean "no filter".
    it('returns nothing for an empty workspace list when the operator is not OR', async () => {
      await expect(idsFrom({ workspaces: [] })).resolves.toEqual([]);
    });

    it('returns nothing for an empty workspace list even with an ACL, when not OR', async () => {
      await expect(
        idsFrom({
          workspaces: [],
          ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] },
        })
      ).resolves.toEqual([]);
    });

    // Under OR the ACL clause survives an empty workspace list, so a caller in no
    // workspace still sees what their own ACL grants. Returning [] here would be a
    // functional regression, not a safe default.
    it('falls back to ACL-granted objects for an empty workspace list under OR', async () => {
      await expect(
        idsFrom({
          workspaces: [],
          workspacesSearchOperator: 'OR',
          ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] },
        })
      ).resolves.toEqual(['acl-alice', 'acl-group', 'acl-star'].sort());
    });

    it('unions workspace and ACL matches under OR', async () => {
      await expect(
        idsFrom({
          workspaces: ['ws-a'],
          workspacesSearchOperator: 'OR',
          ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] },
        })
      ).resolves.toEqual(['acl-alice', 'acl-group', 'acl-star', 'in-ws-a'].sort());
    });

    it('intersects workspace and ACL matches when the operator is not OR', async () => {
      // `in-ws-a` is in the workspace but carries no ACL granting alice, so the
      // intersection is empty.
      await expect(
        idsFrom({
          workspaces: ['ws-a'],
          ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] },
        })
      ).resolves.toEqual([]);
    });

    it('returns only ACL-granted objects when ACL is supplied without workspaces', async () => {
      await expect(
        idsFrom({ ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] } })
      ).resolves.toEqual(['acl-alice', 'acl-group', 'acl-star'].sort());
    });

    it('does not match an ACL granting a different principal', async () => {
      const ids = await idsFrom({
        ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] },
      });
      expect(ids).not.toContain('acl-bob');
    });

    it('distinguishes permission modes', async () => {
      // Every seeded ACL grants `read` only, so a `write` request matches just the
      // wildcard-free nothing -- except `acl-star`, which is also read-only.
      await expect(
        idsFrom({ ACLSearchParams: { principals: alicePrincipals, permissionModes: ['write'] } })
      ).resolves.toEqual([]);
    });

    it('ignores ACLSearchParams with no permission modes', async () => {
      // `permissionModes` empty means the ACL clause is not built at all, so this
      // degenerates to "no tenancy constraint" rather than "match nothing".
      await expect(
        idsFrom({ ACLSearchParams: { principals: alicePrincipals, permissionModes: [] } })
      ).resolves.toEqual(
        ['acl-alice', 'acl-bob', 'acl-group', 'acl-star', 'bare', 'in-ws-a', 'in-ws-b'].sort()
      );
    });

    describe('bulkCreate must not take authorization input from the object', () => {
      it('uses options.workspaces rather than a per-object workspaces attribute', async () => {
        await repo.bulkCreate(
          [{ type: TYPE, id: 'planted', attributes: { title: 'planted' }, workspaces: ['ws-b'] }],
          { workspaces: ['ws-a'] } as Parameters<typeof repo.bulkCreate>[1]
        );

        // The object must land in the workspace the request authorized, not the one it
        // asked for.
        await expect(idsFrom({ workspaces: ['ws-b'] })).resolves.not.toContain('planted');
        await expect(idsFrom({ workspaces: ['ws-a'] })).resolves.toContain('planted');
      });

      it('preserves an existing object ACL when overwriting', async () => {
        await repo.bulkCreate(
          [{ type: TYPE, id: 'acl-alice', attributes: { title: 'overwritten' } }],
          { overwrite: true } as Parameters<typeof repo.bulkCreate>[1]
        );

        // Overwriting content must not clear the ACL and make the object public.
        await expect(
          idsFrom({ ACLSearchParams: { principals: alicePrincipals, permissionModes: ['read'] } })
        ).resolves.toContain('acl-alice');
      });
    });
  });
};
