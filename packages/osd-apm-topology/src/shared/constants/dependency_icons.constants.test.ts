/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEPENDENCY_ICONS,
  getDependencyIconKey,
  getDependencySystemIcon,
  isBrandDependencySystem,
  isBrandIconKey,
  getBrandIconClassName,
  getDependencySystemDarkIcon,
  normalizeDependencySystem,
} from './dependency_icons.constants';
import { ICONS } from './icons.constants';

describe('dependency icons', () => {
  it('maps deprecated db.system values and separator variants to the current OTel value', () => {
    expect(normalizeDependencySystem('MSSQL')).toBe('microsoft.sql_server');
    expect(normalizeDependencySystem('dynamodb')).toBe('aws.dynamodb');
    expect(normalizeDependencySystem('h2')).toBe('h2database');
    expect(normalizeDependencySystem('aws.sqs')).toBe('aws_sqs');
    expect(normalizeDependencySystem(' PostgreSQL ')).toBe('postgresql');
    expect(normalizeDependencySystem('')).toBeUndefined();
  });

  it('picks the system icon by its current or deprecated name', () => {
    expect(getDependencyIconKey('database', 'postgresql')).toBe('Dependency::postgresql');
    expect(getDependencyIconKey('database', 'dynamodb')).toBe('Dependency::aws.dynamodb');
    expect(getDependencyIconKey('database', 'spanner')).toBe('Dependency::gcp.spanner');
    expect(getDependencyIconKey('messaging', 'kafka')).toBe('Dependency::kafka');
    expect(getDependencyIconKey('messaging', 'aws.sqs')).toBe('Dependency::aws_sqs');
    // MariaDB has its own mark rather than MySQL's.
    expect(getDependencyIconKey('database', 'mariadb')).toBe('Dependency::mariadb');
    expect(getDependencySystemIcon('mariadb')).toBeDefined();
  });

  it('falls back to the generic type glyph, never another brand, when a system has no icon', () => {
    // No open-source mark: IBM, Azure, Memcached, custom values.
    ['ibm.db2', 'db2', 'azure.cosmosdb', 'memcached', 'my_custom_db'].forEach((system) =>
      expect(getDependencyIconKey('database', system)).toBe('Dependency::database')
    );
    ['activemq', 'servicebus', 'eventhubs', 'jms'].forEach((system) =>
      expect(getDependencyIconKey('messaging', system)).toBe('Dependency::messaging')
    );
    expect(getDependencyIconKey('external')).toBe('Dependency::external');
    expect(getDependencyIconKey('cache')).toBe('Dependency::external');
  });

  it('registers every key it returns in ICONS', () => {
    Object.keys(DEPENDENCY_ICONS).forEach((key) => expect(ICONS[key]).toBe(DEPENDENCY_ICONS[key]));
    expect(ICONS[getDependencyIconKey('messaging', 'rabbitmq')]).toBeDefined();
    // Callers that predate the keys keep working.
    expect(ICONS.Kafka).toBe(ICONS['Dependency::kafka']);
  });

  it('tells full-color brand marks from monochrome icons', () => {
    expect(isBrandDependencySystem('postgresql')).toBe(true);
    expect(isBrandDependencySystem('Kafka')).toBe(true);
    expect(isBrandIconKey('Dependency::rabbitmq')).toBe(true);
    // AWS icons and generic glyphs are monochrome (inverted in dark mode).
    expect(isBrandDependencySystem('aws.sqs')).toBe(false);
    expect(isBrandIconKey('Dependency::database')).toBe(false);
    expect(isBrandIconKey('AWS::RDS')).toBe(false);
    expect(isBrandDependencySystem(undefined)).toBe(false);
  });

  it('renders a brand mark transparent in its color, in one color only where it is too faint', () => {
    expect(getBrandIconClassName('postgresql')).toBe('celBrandIcon');
    // Near-black marks turn white in dark mode; very light ones turn black in light mode.
    expect(getBrandIconClassName('kafka')).toBe('celBrandIcon celBrandIcon--monoOnDark');
    expect(getBrandIconClassName('sqlite')).toContain('celBrandIcon--monoOnDark');
    expect(getBrandIconClassName('clickhouse')).toBe('celBrandIcon celBrandIcon--monoOnLight');
    // Not brand marks: monochrome AWS icons and generic glyphs.
    expect(getBrandIconClassName('aws_sqs')).toBe('');
    expect(getBrandIconClassName('my_custom_db')).toBe('');
  });

  it('uses the Dashboard Icons marks for Valkey, SQL Server and Oracle, by current or old name', () => {
    expect(getDependencyIconKey('database', 'valkey')).toBe('Dependency::valkey');
    expect(getDependencyIconKey('database', 'mssql')).toBe('Dependency::microsoft.sql_server');
    expect(getDependencyIconKey('database', 'oracle')).toBe('Dependency::oracle.db');
    // Valkey has its own mark, not Redis's.
    expect(getDependencyIconKey('database', 'valkey')).not.toBe(
      getDependencyIconKey('database', 'redis')
    );
    // The near-black Valkey mark turns white in dark mode; SQL Server has a vendor light version.
    expect(getBrandIconClassName('valkey')).toContain('celBrandIcon--monoOnDark');
    expect(getDependencySystemDarkIcon('microsoft.sql_server')).toBeDefined();
    expect(getDependencySystemDarkIcon('mssql')).toBeDefined();
    expect(getDependencySystemDarkIcon('postgresql')).toBeUndefined();
  });
});
