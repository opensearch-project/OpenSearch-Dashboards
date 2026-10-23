/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import rison from 'rison-node';
import { ALL_OPTION_VALUE, VariableValue } from '../../../../../dashboard/public';
import { cellValueText } from './table_vis_utils';

/**
 * Placeholder grammar, compatible with Grafana data links:
 *
 *   ${__value.text}                 the clicked cell value
 *   ${__data.fields.<name>}         a field of the same row; <name> may contain dots
 *   ${__data.fields["<name>"]}      the same, for names with spaces or other characters
 *   ${__data.fields['<name>']}
 *   ${<variable>}  or  $<variable>  a dashboard variable
 *
 * A `:rison` format suffix may follow the body of any placeholder, for example
 * ${__value.text:rison} or $<variable>:rison. Field names containing `}` are
 * not supported.
 */

/** Outer form: a braced body, or a bare variable with an optional format. */
const PLACEHOLDER = /\$\{([^}]+)\}|\$(\w+)(:rison)?/g;

/** Braced bodies. Each one captures the format suffix as its last group. */
const CLICKED_VALUE = /^__value\.text(:rison)?$/;
// The dotted name is lazy so that a trailing `:rison` is the suffix, while a
// colon elsewhere (`http:status`) stays part of the name. Keep it lazy.
const ROW_FIELD = /^__data\.fields(?:\.(.+?)|\[\s*"([^"]*)"\s*\]|\[\s*'([^']*)'\s*\])(:rison)?$/;
const VARIABLE = /^(\w+)(:rison)?$/;

const RISON = ':rison';

/**
 * :rison uses rison.encode_uri, so a list becomes one rison array. Otherwise
 * each item is a percent-encoded query value and a list is joined with `,`
 * (a `,` inside an item is `%2C`, so the join is unambiguous).
 */
const encode = (text: string | string[], asRison: boolean): string => {
  if (asRison) {
    return rison.encode_uri(text);
  }
  return Array.isArray(text) ? text.map(encodeURIComponent).join(',') : encodeURIComponent(text);
};

/**
 * Returns undefined for an unknown variable, so the placeholder is kept.
 * With "All" selected, `values` holds every option; the link carries the
 * dashboard's All marker instead, so the target selects All as well.
 */
const resolveVariable = (
  name: string,
  asRison: boolean,
  variables: VariableValue[]
): string | undefined => {
  const variable = variables.find((v) => v.name === name);
  if (!variable) {
    return undefined;
  }
  if (variable.isAll) {
    return encode(asRison ? [ALL_OPTION_VALUE] : ALL_OPTION_VALUE, asRison);
  }
  return encode(variable.multi ? (variable.values ?? []) : variable.value, asRison);
};

/** Returns undefined for an unknown body, field or variable, so the placeholder is kept. */
const resolveBraced = (
  body: string,
  value: unknown,
  row: Record<string, unknown>,
  variables: VariableValue[]
): string | undefined => {
  const clicked = CLICKED_VALUE.exec(body);
  if (clicked) {
    return encode(cellValueText(value), clicked[1] === RISON);
  }
  const field = ROW_FIELD.exec(body);
  if (field) {
    const name = field[1] ?? field[2] ?? field[3];
    return Object.prototype.hasOwnProperty.call(row, name)
      ? encode(cellValueText(row[name]), field[4] === RISON)
      : undefined;
  }
  const variable = VARIABLE.exec(body);
  if (variable) {
    return resolveVariable(variable[1], variable[2] === RISON, variables);
  }
  return undefined;
};

export interface ResolvedDataLink {
  url: string;
  /** Placeholders left in `url` because they could not be resolved. */
  unresolved: string[];
}

/**
 * Resolves the placeholders of a table data link URL in one pass, so a
 * substituted value is never expanded again. Placeholders for missing fields,
 * unknown variables or unknown suffixes stay as they are and are reported in
 * `unresolved`, so the caller can decide not to show the link.
 */
export const resolveDataLink = (
  url: string,
  value: unknown,
  row: Record<string, unknown> = {},
  variables: VariableValue[] = []
): ResolvedDataLink => {
  const unresolved: string[] = [];
  const resolvedUrl = url.replace(
    PLACEHOLDER,
    (match: string, braced?: string, bareVariable?: string, bareFormat?: string) => {
      const resolved =
        braced !== undefined
          ? resolveBraced(braced, value, row, variables)
          : resolveVariable(bareVariable as string, bareFormat === RISON, variables);
      if (resolved === undefined) {
        unresolved.push(match);
        return match;
      }
      return resolved;
    }
  );
  return { url: resolvedUrl, unresolved };
};

// eslint-disable-next-line no-script-url
const SCRIPT_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:']);

const RELATIVE_BASE = 'http://relative.invalid';
const RELATIVE_ORIGIN = new URL(RELATIVE_BASE).origin;

/**
 * A resolved link may only navigate. Substituted values are encoded (a rison
 * string with a `:` is quoted, so it cannot start a scheme), but the template
 * itself is author input. Parsing with a base also catches scheme obfuscation
 * such as whitespace or mixed case.
 *
 * When the template is given and is relative, the resolved URL must stay
 * relative: rison leaves `/` unescaped, so a value like `/evil.com` at the
 * start of a relative template would otherwise give `//evil.com`, another host.
 */
export const isNavigableDataLinkUrl = (url: string, template?: string): boolean => {
  try {
    const resolved = new URL(url, RELATIVE_BASE);
    if (SCRIPT_PROTOCOLS.has(resolved.protocol)) {
      return false;
    }
    const templateIsRelative =
      template !== undefined &&
      new URL(template.replace(PLACEHOLDER, 'x'), RELATIVE_BASE).origin === RELATIVE_ORIGIN;
    return !templateIsRelative || resolved.origin === RELATIVE_ORIGIN;
  } catch {
    return false;
  }
};
