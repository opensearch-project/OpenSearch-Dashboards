/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Brand icons for well-known dependency systems, keyed by the OTel
 * `db.system.name` / `messaging.system` value (see the dependency classifier).
 * Icons are from Simple Icons (https://simpleicons.org, CC0), brand-colored so
 * they render in both light and dark themes. When no brand icon exists the UI
 * falls back to a category glyph (see `dependencyIconType`).
 * @see https://opentelemetry.io/docs/specs/semconv/database/
 */
import postgresqlIcon from '../resources/dependency_icons/postgresql.svg';
import redisIcon from '../resources/dependency_icons/redis.svg';
import mysqlIcon from '../resources/dependency_icons/mysql.svg';
import mongodbIcon from '../resources/dependency_icons/mongodb.svg';

const SYSTEM_ICONS: Record<string, string> = {
  postgresql: postgresqlIcon,
  redis: redisIcon,
  valkey: redisIcon, // Redis-compatible fork (used by the OTel demo)
  mysql: mysqlIcon,
  mariadb: mysqlIcon, // MySQL-compatible
  mongodb: mongodbIcon,
};

/**
 * Resolve a brand icon URL for a dependency system, or undefined when there is
 * no brand icon (caller then uses the category glyph).
 */
export const getDependencyBrandIcon = (system?: string): string | undefined =>
  system ? SYSTEM_ICONS[system.toLowerCase()] : undefined;
