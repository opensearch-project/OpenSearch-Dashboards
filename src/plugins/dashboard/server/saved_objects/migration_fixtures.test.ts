/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import * as fs from 'fs';
import * as path from 'path';
import { savedObjectsServiceMock } from '../../../../core/server/mocks';
import { dashboardSavedObjectTypeMigrations } from './dashboard_migrations';

interface MigrationFixture {
  description: string;
  type: string;
  migrationVersion: string;
  input: Record<string, any>;
  expected: {
    references_length?: number;
    references_contain?: Array<{ type: string; id: string }>;
    attributes_has?: string[];
    attributes_equals?: Record<string, any>;
  };
}

function loadFixtures(dir: string): MigrationFixture[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
}

const fixtures = loadFixtures(path.join(__dirname, 'test_fixtures'));
const migrations = dashboardSavedObjectTypeMigrations as Record<string, any>;
const contextMock = savedObjectsServiceMock.createMigrationContext();
const allVersions = Object.keys(migrations);
const testedVersions = new Set<string>();

describe('dashboard data-driven migration tests', () => {
  fixtures.forEach((fixture) => {
    const migration = migrations[fixture.migrationVersion];
    if (!migration) {
      it.skip(`${fixture.description} (v${fixture.migrationVersion} not found)`, () => {});
      return;
    }
    testedVersions.add(fixture.migrationVersion);

    it(fixture.description, () => {
      const result = migration(fixture.input, contextMock);
      if (fixture.expected.references_length !== undefined) {
        expect(result.references?.length).toBe(fixture.expected.references_length);
      }
      if (fixture.expected.references_contain) {
        for (const ref of fixture.expected.references_contain) {
          expect(result.references).toEqual(expect.arrayContaining([expect.objectContaining(ref)]));
        }
      }
      if (fixture.expected.attributes_has) {
        for (const key of fixture.expected.attributes_has) {
          expect(result.attributes).toHaveProperty(key);
        }
      }
      if (fixture.expected.attributes_equals) {
        for (const [key, value] of Object.entries(fixture.expected.attributes_equals)) {
          expect(result.attributes[key]).toEqual(value);
        }
      }
    });
  });

  // Coverage summary — JSON output parseable by CI tools
  afterAll(() => {
    const untested = allVersions.filter((v) => !testedVersions.has(v));
    const coverage = {
      type: 'dashboard',
      totalMigrations: allVersions.length,
      testedMigrations: testedVersions.size,
      coveragePercent: Math.round((testedVersions.size / allVersions.length) * 100),
      testedVersions: [...testedVersions].sort(),
      untestedVersions: untested.sort(),
      fixtureCount: fixtures.length,
    };
    // eslint-disable-next-line no-console
    console.log(`\n--- Migration Coverage: dashboard ---\n${JSON.stringify(coverage, null, 2)}`);
    if (untested.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`⚠️  Untested: ${untested.join(', ')}. Add fixtures to test_fixtures/`);
    }
  });
});
