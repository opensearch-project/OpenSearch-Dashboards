/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pattern matching ${var.NAME} and ${env.NAME} placeholders.
 */
const VARIABLE_PATTERN = /\$\{(var|env)\.([^}]+)\}/g;

/**
 * Substitutes ${var.NAME} and ${env.NAME} placeholders in a string or object.
 * - ${var.NAME} resolves from the provided variables map (config variables)
 * - ${env.NAME} resolves from process.env
 *
 * Recursively walks objects and arrays. Throws an error if a referenced
 * variable is not defined.
 *
 * @param value - The value to perform substitution on (string, object, array, or primitive)
 * @param variables - A map of variable names to their values (from config)
 * @param profileName - The active profile name, used in error messages
 * @returns The value with all placeholders replaced
 */
export function substituteVariables(
  value: unknown,
  variables: Record<string, string>,
  profileName?: string
): unknown {
  if (typeof value === 'string') {
    return substituteString(value, variables, profileName);
  }

  if (Array.isArray(value)) {
    return value.map((item) => substituteVariables(item, variables, profileName));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = substituteVariables(val, variables, profileName);
    }
    return result;
  }

  // Primitives (number, boolean, null, undefined) pass through unchanged
  return value;
}

/**
 * Replace all ${var.NAME} and ${env.NAME} placeholders in a single string.
 */
function substituteString(
  input: string,
  variables: Record<string, string>,
  profileName?: string
): string {
  return input.replace(VARIABLE_PATTERN, (_match, prefix: string, name: string) => {
    if (prefix === 'var') {
      if (!(name in variables)) {
        const profileHint = profileName ? ` in profile '${profileName}'` : '';
        throw new Error(`Variable '${name}' is not defined${profileHint}`);
      }
      return variables[name];
    }

    // prefix === 'env'
    const envValue = process.env[name];
    if (envValue === undefined) {
      throw new Error(
        `Environment variable '${name}' is not set (referenced as \${env.${name}})`
      );
    }
    return envValue;
  });
}

/**
 * Merge top-level variables with profile-level variables.
 * Profile variables take precedence over top-level variables.
 */
export function resolveVariables(
  topLevel: Record<string, string> | undefined,
  profileLevel: Record<string, string> | undefined
): Record<string, string> {
  return {
    ...(topLevel || {}),
    ...(profileLevel || {}),
  };
}
