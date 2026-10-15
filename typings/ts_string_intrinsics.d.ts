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

/**
 * Approximations of the intrinsic string-manipulation types TypeScript added in
 * 4.1. This branch pins TypeScript 4.0.2, where they do not exist, so the
 * typings shipped with `@hapi/hapi` >= 21 fail to compile with
 * `TS2304: Cannot find name 'Lowercase'`.
 *
 * These widen the result to `string` rather than transforming the literal, so a
 * value typed `Lowercase<'GET' | 'POST'>` becomes `string`. Runtime is
 * unaffected; only the narrowness of the type is lost.
 *
 * Remove this file when the branch moves to TypeScript 4.1 or newer — the real
 * intrinsics are declared in `lib.es5.d.ts` from 4.1 on, and keeping both would
 * be a duplicate declaration.
 */

type Lowercase<S extends string> = string;
type Uppercase<S extends string> = string;
type Capitalize<S extends string> = string;
type Uncapitalize<S extends string> = string;
