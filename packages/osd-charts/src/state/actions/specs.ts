import { Spec } from '../../specs';

export const UPSERT_SPEC = 'UPSERT_SPEC';
export const REMOVE_SPEC = 'REMOVE_SPEC';
export const SPEC_PARSED = 'SPEC_PARSED';
export const SPEC_PARSING = 'SPEC_PARSING';
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

export function upsertSpec(spec: Spec): UpsertSpecAction {
  return { type: UPSERT_SPEC, spec };
}

export function removeSpec(id: string): RemoveSpecAction {
  return { type: REMOVE_SPEC, id };
}

export function specParsed(): SpecParsedAction {
  return { type: SPEC_PARSED };
}

export function specParsing(): SpecParsingAction {
  return { type: SPEC_PARSING };
}

export function specUnmounted(): SpecUnmountedAction {
  return { type: SPEC_UNMOUNTED };
}

export type SpecActions =
  | SpecParsingAction
  | SpecParsedAction
  | SpecUnmountedAction
  | UpsertSpecAction
  | RemoveSpecAction;
