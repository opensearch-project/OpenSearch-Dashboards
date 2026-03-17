/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Trusted endpoints that may be called for connect-src and img-src in our CSP directives.
 */
export const CSP_TRUSTED_ENDPOINTS = [
  'https://opensearch.org',
  'https://docs.opensearch.org',
  'https://maps.opensearch.org',
  'https://vectors.maps.opensearch.org',
  'https://tiles.maps.opensearch.org',
];

/**
 * Directive map for CSP
 */
export const CSP_DIRECTIVES = {
  default: 'default-src',
  script: 'script-src',
  scriptAttr: 'script-src-attr',
  style: 'style-src',
  styleElem: 'style-src-elem',
  styleAttr: 'style-src-attr',
  child: 'child-src',
  worker: 'worker-src',
  frame: 'frame-src',
  object: 'object-src',
  manifest: 'manifest-src',
  media: 'media-src',
  font: 'font-src',
  connect: 'connect-src',
  img: 'img-src',
  formAction: 'form-action',
  frameAncestors: 'frame-ancestors',
} as const;

/**
 * Default values for strict CSP rules
 */
export const STRICT_CSP_DEFAULT_SRC_VALUE = `'self'`;
export const STRICT_CSP_SCRIPT_SRC_VALUE = `'self'`;
export const STRICT_CSP_SCRIPT_SRC_ATTR_VALUE = `'none'`;
export const STRICT_CSP_STYLE_SRC_VALUE = `'self'`;
export const STRICT_CSP_STYLE_SRC_ELEM_VALUE = `'self'`;
export const STRICT_CSP_STYLE_SRC_ATTR_VALUE = `'self' 'unsafe-inline'`;
export const STRICT_CSP_CHILD_SRC_VALUE = `'none'`;
export const STRICT_CSP_WORKER_SRC_VALUE = `'self'`;
export const STRICT_CSP_FRAME_SRC_VALUE = `'none'`;
export const STRICT_CSP_OBJECT_SRC_VALUE = `'none'`;
export const STRICT_CSP_MANIFEST_SRC_VALUE = `'self'`;
export const STRICT_CSP_MEDIA_SRC_VALUE = `'none'`;
export const STRICT_CSP_FONT_SRC_VALUE = `'self'`;
export const STRICT_CSP_CONNECT_SRC_VALUE = `'self' ${CSP_TRUSTED_ENDPOINTS.join(' ')}`;
export const STRICT_CSP_IMG_SRC_VALUE = `'self' data: ${CSP_TRUSTED_ENDPOINTS.join(' ')}`;
export const STRICT_CSP_FORM_ACTION_VALUE = `'self'`;
export const STRICT_CSP_FRAME_ANCESTORS_VALUE = `'self'`;

/**
 * Default values applied for strict CSP rules
 */
export const STRICT_CSP_RULES_DEFAULT_VALUE = [
  `${CSP_DIRECTIVES.default} ${STRICT_CSP_DEFAULT_SRC_VALUE}`,
  `${CSP_DIRECTIVES.script} ${STRICT_CSP_SCRIPT_SRC_VALUE}`,
  `${CSP_DIRECTIVES.scriptAttr} ${STRICT_CSP_SCRIPT_SRC_ATTR_VALUE}`,
  `${CSP_DIRECTIVES.style} ${STRICT_CSP_STYLE_SRC_VALUE}`,
  `${CSP_DIRECTIVES.styleElem} ${STRICT_CSP_STYLE_SRC_ELEM_VALUE}`,
  `${CSP_DIRECTIVES.styleAttr} ${STRICT_CSP_STYLE_SRC_ATTR_VALUE}`,
  `${CSP_DIRECTIVES.child} ${STRICT_CSP_CHILD_SRC_VALUE}`,
  `${CSP_DIRECTIVES.worker} ${STRICT_CSP_WORKER_SRC_VALUE}`,
  `${CSP_DIRECTIVES.frame} ${STRICT_CSP_FRAME_SRC_VALUE}`,
  `${CSP_DIRECTIVES.object} ${STRICT_CSP_OBJECT_SRC_VALUE}`,
  `${CSP_DIRECTIVES.manifest} ${STRICT_CSP_MANIFEST_SRC_VALUE}`,
  `${CSP_DIRECTIVES.media} ${STRICT_CSP_MEDIA_SRC_VALUE}`,
  `${CSP_DIRECTIVES.font} ${STRICT_CSP_FONT_SRC_VALUE}`,
  `${CSP_DIRECTIVES.connect} ${STRICT_CSP_CONNECT_SRC_VALUE}`,
  `${CSP_DIRECTIVES.img} ${STRICT_CSP_IMG_SRC_VALUE}`,
  `${CSP_DIRECTIVES.formAction} ${STRICT_CSP_FORM_ACTION_VALUE}`,
  `${CSP_DIRECTIVES.frameAncestors} ${STRICT_CSP_FRAME_ANCESTORS_VALUE}`,
];

/**
 * Default values applied for loose CSP rules
 */
export const LOOSE_CSP_RULES_DEFAULT_VALUE = [
  `${CSP_DIRECTIVES.script} 'unsafe-eval' 'self'`,
  `${CSP_DIRECTIVES.worker} blob: 'self'`,
  `${CSP_DIRECTIVES.style} 'unsafe-inline' 'self'`,
];

/**
 * Allowed source configuration for CSP directives.
 * @internal
 */
export interface AllowedSourcesConfig {
  allowedFrameAncestorSources?: string[];
  allowedConnectSources?: string[];
  allowedImgSources?: string[];
}
