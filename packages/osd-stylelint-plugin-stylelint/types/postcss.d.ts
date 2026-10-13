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
 * Minimal type shim for `postcss`, mapped via `paths` in tsconfig.json.
 *
 * The typings shipped with postcss >= 8.4.22 crash the TypeScript 4.0 compiler
 * used on this branch, so this package (and the `stylelint` typings it consumes)
 * resolve `postcss` to these loose types instead. Runtime is unaffected.
 */

export type Node = any;
export type Root = any;
export type Rule = any;
export type AtRule = any;
export type Declaration = any;
export type Comment = any;
export type Result = any;
export type Message = any;
export type Warning = any;
export type WarningOptions = any;
export type Syntax = any;
export type PluginCreator<T = any> = any;
