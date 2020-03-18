/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Spec } from '../../specs';

/** @internal */
export const UPSERT_SPEC = 'UPSERT_SPEC';

/** @internal */
export const REMOVE_SPEC = 'REMOVE_SPEC';

/** @internal */
export const SPEC_PARSED = 'SPEC_PARSED';

/** @internal */
export const SPEC_PARSING = 'SPEC_PARSING';

/** @internal */
export const SPEC_UNMOUNTED = 'SPEC_UNMOUNTED';

interface SpecParsingAction {
  type: typeof SPEC_PARSING;
}

interface SpecParsedAction {
  type: typeof SPEC_PARSED;
}

interface SpecUnmountedAction {
  type: typeof SPEC_UNMOUNTED;
}

interface UpsertSpecAction {
  type: typeof UPSERT_SPEC;
  spec: Spec;
}

interface RemoveSpecAction {
  type: typeof REMOVE_SPEC;
  id: string;
}

/** @internal */
export function upsertSpec(spec: Spec): UpsertSpecAction {
  return { type: UPSERT_SPEC, spec };
}

/** @internal */
export function removeSpec(id: string): RemoveSpecAction {
  return { type: REMOVE_SPEC, id };
}

/** @internal */
export function specParsed(): SpecParsedAction {
  return { type: SPEC_PARSED };
}

/** @internal */
export function specParsing(): SpecParsingAction {
  return { type: SPEC_PARSING };
}

/** @internal */
export function specUnmounted(): SpecUnmountedAction {
  return { type: SPEC_UNMOUNTED };
}

/** @internal */
export type SpecActions =
  | SpecParsingAction
  | SpecParsedAction
  | SpecUnmountedAction
  | UpsertSpecAction
  | RemoveSpecAction;
