/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { schema, TypeOf } from '@osd/config-schema';
import { PluginInitializerContext, PluginConfigDescriptor } from '../../../../src/core/server';
import { SecurityPlugin } from './plugin';

const validateAuthType = (value: string[]) => {
  const supportedAuthTypes = [
    '',
    'basic',
    'jwt',
    'openid',
    'saml',
    'proxy',
    'kerberos',
    'proxycache',
  ];

  value.forEach((authVal) => {
    if (!supportedAuthTypes.includes(authVal.toLowerCase())) {
      throw new Error(
        `Unsupported authentication type: ${authVal}. Allowed auth.type are ${supportedAuthTypes}.`
      );
    }
  });
};

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  allow_client_certificates: schema.boolean({ defaultValue: false }),
  readonly_mode: schema.object({
    roles: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  clusterPermissions: schema.object({
    include: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  indexPermissions: schema.object({
    include: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  disabledTransportCategories: schema.object({
    exclude: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  disabledRestCategories: schema.object({
    exclude: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  cookie: schema.object({
    secure: schema.boolean({ defaultValue: false }),
    name: schema.string({ defaultValue: 'security_authentication' }),
    password: schema.string({ defaultValue: 'security_cookie_default_password', minLength: 32 }),
    ttl: schema.number({ defaultValue: 60 * 60 * 1000 }),
    domain: schema.nullable(schema.string()),
    isSameSite: schema.oneOf(
      [
        schema.literal('Strict'),
        schema.literal('Lax'),
        schema.literal('None'),
        schema.literal(false),
      ],
      { defaultValue: false }
    ),
  }),
  session: schema.object({
    ttl: schema.number({ defaultValue: 60 * 60 * 1000 }),
    keepalive: schema.boolean({ defaultValue: true }),
  }),
  auth: schema.object({
    type: schema.oneOf(
      [
        schema.arrayOf(schema.string(), {
          defaultValue: [''],
          validate(value: string[]) {
            if (!value || value.length === 0) {
              return `Authentication type is not configured properly. At least one authentication type must be selected.`;
            }

            if (value.length > 1) {
              const includeBasicAuth = value.find((element) => {
                return element.toLowerCase() === 'basicauth';
              });

              if (!includeBasicAuth) {
                return `Authentication type is not configured properly. basicauth is mandatory.`;
              }
            }

            validateAuthType(value);
          },
        }),
        schema.string({
          defaultValue: '',
          validate(value) {
            const valArray: string[] = [];
            valArray.push(value);
            validateAuthType(valArray);
          },
        }),
      ],
      { defaultValue: '' }
    ),
    anonymous_auth_enabled: schema.boolean({ defaultValue: false }),
    unauthenticated_routes: schema.arrayOf(schema.string(), {
      defaultValue: ['/api/reporting/stats'],
    }),
    forbidden_usernames: schema.arrayOf(schema.string(), { defaultValue: [] }),
    logout_url: schema.string({ defaultValue: '' }),
    multiple_auth_enabled: schema.boolean({ defaultValue: false }),
  }),
  basicauth: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    unauthenticated_routes: schema.arrayOf(schema.string(), { defaultValue: [] }),
    forbidden_usernames: schema.arrayOf(schema.string(), { defaultValue: [] }),
    header_trumps_session: schema.boolean({ defaultValue: false }),
    alternative_login: schema.object({
      headers: schema.arrayOf(schema.string(), { defaultValue: [] }),
      show_for_parameter: schema.string({ defaultValue: '' }),
      valid_redirects: schema.arrayOf(schema.string(), { defaultValue: [] }),
      button_text: schema.string({ defaultValue: 'Log in with provider' }),
      buttonstyle: schema.string({ defaultValue: '' }),
    }),
    loadbalancer_url: schema.maybe(schema.string()),
    login: schema.object({
      title: schema.string({ defaultValue: 'Log in to OpenSearch Dashboards' }),
      subtitle: schema.string({
        defaultValue:
          'If you have forgotten your username or password, contact your system administrator.',
      }),
      showbrandimage: schema.boolean({ defaultValue: true }),
      brandimage: schema.string({ defaultValue: '' }), // TODO: update brand image
      buttonstyle: schema.string({ defaultValue: '' }),
    }),
  }),
  multitenancy: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    show_roles: schema.boolean({ defaultValue: false }),
    enable_filter: schema.boolean({ defaultValue: false }),
    debug: schema.boolean({ defaultValue: false }),
    tenants: schema.object({
      enable_private: schema.boolean({ defaultValue: true }),
      enable_global: schema.boolean({ defaultValue: true }),
      preferred: schema.arrayOf(schema.string(), { defaultValue: [] }),
    }),
  }),
  configuration: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
  }),
  accountinfo: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  openid: schema.maybe(
    schema.object({
      connect_url: schema.maybe(schema.string()),
      header: schema.string({ defaultValue: 'Authorization' }),
      // TODO: test if siblingRef() works here
      // client_id is required when auth.type is openid
      client_id: schema.conditional(
        schema.siblingRef('auth.type'),
        'openid',
        schema.string(),
        schema.maybe(schema.string())
      ),
      client_secret: schema.string({ defaultValue: '' }),
      scope: schema.string({ defaultValue: 'openid profile email address phone' }),
      base_redirect_url: schema.string({ defaultValue: '' }),
      logout_url: schema.string({ defaultValue: '' }),
      root_ca: schema.string({ defaultValue: '' }),
      verify_hostnames: schema.boolean({ defaultValue: true }),
      refresh_tokens: schema.boolean({ defaultValue: true }),
      trust_dynamic_headers: schema.boolean({ defaultValue: false }),
    })
  ),
  proxycache: schema.maybe(
    schema.object({
      // when auth.type is proxycache, user_header, roles_header and proxy_header_ip are required
      user_header: schema.conditional(
        schema.siblingRef('auth.type'),
        'proxycache',
        schema.string(),
        schema.maybe(schema.string())
      ),
      roles_header: schema.conditional(
        schema.siblingRef('auth.type'),
        'proxycache',
        schema.string(),
        schema.maybe(schema.string())
      ),
      proxy_header: schema.maybe(schema.string({ defaultValue: 'x-forwarded-for' })),
      proxy_header_ip: schema.conditional(
        schema.siblingRef('auth.type'),
        'proxycache',
        schema.string(),
        schema.maybe(schema.string())
      ),
      login_endpoint: schema.maybe(schema.string({ defaultValue: '' })),
    })
  ),
  jwt: schema.maybe(
    schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      login_endpoint: schema.maybe(schema.string()),
      url_param: schema.string({ defaultValue: 'authorization' }),
      header: schema.string({ defaultValue: 'Authorization' }),
    })
  ),
  ui: schema.object({
    basicauth: schema.object({
      // the login config here is the same as old config `_security.basicauth.login`
      // Since we are now rendering login page to browser app, so move these config to browser side.
      login: schema.object({
        title: schema.string({ defaultValue: 'Log in to OpenSearch Dashboards' }),
        subtitle: schema.string({
          defaultValue:
            'If you have forgotten your username or password, contact your system administrator.',
        }),
        showbrandimage: schema.boolean({ defaultValue: true }),
        brandimage: schema.string({ defaultValue: '' }),
        buttonstyle: schema.string({ defaultValue: '' }),
      }),
    }),
    anonymous: schema.object({
      login: schema.object({
        buttonname: schema.string({ defaultValue: 'Log in as anonymous' }),
        showbrandimage: schema.boolean({ defaultValue: false }),
        brandimage: schema.string({ defaultValue: '' }),
        buttonstyle: schema.string({ defaultValue: '' }),
      }),
    }),
    openid: schema.object({
      login: schema.object({
        buttonname: schema.string({ defaultValue: 'Log in with single sign-on' }),
        showbrandimage: schema.boolean({ defaultValue: false }),
        brandimage: schema.string({ defaultValue: '' }),
        buttonstyle: schema.string({ defaultValue: '' }),
      }),
    }),
    saml: schema.object({
      login: schema.object({
        buttonname: schema.string({ defaultValue: 'Log in with single sign-on' }),
        showbrandimage: schema.boolean({ defaultValue: false }),
        brandimage: schema.string({ defaultValue: '' }),
        buttonstyle: schema.string({ defaultValue: '' }),
      }),
    }),
    autologout: schema.boolean({ defaultValue: true }),
    backend_configurable: schema.boolean({ defaultValue: true }),
  }),
});

export type SecurityPluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<SecurityPluginConfigType> = {
  exposeToBrowser: {
    enabled: true,
    auth: true,
    ui: true,
    readonly_mode: true,
  },
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new SecurityPlugin(initializerContext);
}

export { SecurityPluginSetup, SecurityPluginStart } from './types';
