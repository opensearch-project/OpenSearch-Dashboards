/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// monaco-editor bundles its own DOMPurify copy; rspack.config.js points it here so monaco
// uses the dompurify version Dashboards depends on.
import purify from 'dompurify';

export default purify;
export const version = purify.version;
export const isSupported = purify.isSupported;
export const sanitize = purify.sanitize;
export const setConfig = purify.setConfig;
export const clearConfig = purify.clearConfig;
export const isValidAttribute = purify.isValidAttribute;
export const addHook = purify.addHook;
export const removeHook = purify.removeHook;
export const removeHooks = purify.removeHooks;
export const removeAllHooks = purify.removeAllHooks;
