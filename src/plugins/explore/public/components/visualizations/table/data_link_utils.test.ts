/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-script-url */

import { getStateFromOsdUrl } from '../../../../../opensearch_dashboards_utils/public';
import { ALL_OPTION_VALUE, VariableValue } from '../../../../../dashboard/public';
import { isNavigableDataLinkUrl, resolveDataLink } from './data_link_utils';

const resolveUrl = (...args: Parameters<typeof resolveDataLink>) => resolveDataLink(...args).url;

/** Reads _a the way the dashboard app does from a link relative to it. */
const readDashboardState = (href: string) =>
  getStateFromOsdUrl('_a', `http://localhost/app/dashboards${href}`);

const row = {
  service: 'checkout',
  'request path': '/api/orders',
  'resource.service.name': 'cart',
  'http:status': 200,
  'a:rison': 'colon',
  empty: null,
  nested: { a: 1 },
};
const variables: VariableValue[] = [
  { name: 'env', value: 'prod' },
  { name: 'regions', value: 'eu,us', multi: true, values: ['eu west', 'us'] },
  { name: 'none', value: '', multi: true, values: [] },
];
const allRegions: VariableValue[] = [
  { name: 'regions', value: 'eu,us', multi: true, values: ['eu', 'us'], isAll: true },
];

describe('resolveDataLink', () => {
  it.each([
    {
      name: 'clicked value',
      url: 'https://x?q=${__value.text}',
      value: 'a b',
      expected: 'https://x?q=a%20b',
    },
    {
      name: 'every occurrence',
      url: '/${__value.text}/${__value.text}',
      value: 'v',
      expected: '/v/v',
    },
    {
      name: 'reserved characters',
      url: '?v=${__value.text}',
      value: 'a&b#c/d e',
      expected: '?v=a%26b%23c%2Fd%20e',
    },
    {
      name: "' is left as is",
      url: '?v=${__value.text}',
      value: "o'brien",
      expected: "?v=o'brien",
    },
    {
      name: 'object value as JSON',
      url: '?v=${__value.text}',
      value: { b: 2 },
      expected: `?v=${encodeURIComponent('{"b":2}')}`,
    },
    { name: 'row field', url: '?s=${__data.fields.service}', expected: '?s=checkout' },
    {
      name: 'row field with dots',
      url: '?s=${__data.fields.resource.service.name}',
      expected: '?s=cart',
    },
    { name: 'row field with a colon', url: '?s=${__data.fields.http:status}', expected: '?s=200' },
    {
      name: 'bracket field, double quotes',
      url: '?p=${__data.fields["request path"]}',
      expected: '?p=%2Fapi%2Forders',
    },
    {
      name: 'bracket field, single quotes',
      url: "?p=${__data.fields['request path']}",
      expected: '?p=%2Fapi%2Forders',
    },
    {
      name: 'bracket field named like a suffix',
      url: '?s=${__data.fields["a:rison"]}',
      expected: '?s=colon',
    },
    { name: 'null field', url: '?e=${__data.fields.empty}', expected: '?e=' },
    {
      name: 'object field as JSON',
      url: '?n=${__data.fields.nested}',
      expected: `?n=${encodeURIComponent('{"a":1}')}`,
    },
    { name: 'variable, both forms', url: '?e=$env&f=${env}', expected: '?e=prod&f=prod' },
    { name: 'multi-value variable', url: '?r=$regions', expected: '?r=eu%20west,us' },
    { name: 'empty multi-value variable', url: '?r=$none', expected: '?r=' },
    {
      name: 'All selected',
      url: '?r=$regions',
      vars: allRegions,
      expected: `?r=${encodeURIComponent(ALL_OPTION_VALUE)}`,
    },
  ])('percent-encodes: $name', ({ url, value = 'x', vars = variables, expected }) => {
    expect(resolveDataLink(url, value, row, vars)).toEqual({ url: expected, unresolved: [] });
  });

  it.each([
    {
      name: 'clicked value, unquoted',
      url: 'current:!(${__value.text:rison})',
      value: '/api/orders',
      expected: 'current:!(/api/orders)',
    },
    { name: 'space', url: '${__value.text:rison}', value: 'foo bar', expected: "'foo+bar'" },
    { name: "'", url: '${__value.text:rison}', value: "o'brien", expected: "'o!'brien'" },
    { name: '!', url: '${__value.text:rison}', value: 'a!b', expected: "'a!!b'" },
    {
      name: 'bracket field',
      url: '?p=${__data.fields["request path"]:rison}',
      expected: '?p=/api/orders',
    },
    {
      name: 'row field with dots',
      url: '?s=${__data.fields.resource.service.name:rison}',
      expected: '?s=cart',
    },
    { name: 'bare variable', url: '?e=$env:rison', expected: '?e=prod' },
    {
      name: 'multi-value variable as one array',
      url: 'current:${regions:rison}',
      expected: "current:!('eu+west',us)",
    },
    { name: 'empty multi-value variable', url: 'current:${none:rison}', expected: 'current:!()' },
    {
      name: 'All selected',
      url: '?r=${regions:rison}',
      vars: allRegions,
      expected: `?r=!('${ALL_OPTION_VALUE}')`,
    },
  ])('rison-encodes: $name', ({ url, value = 'x', vars = variables, expected }) => {
    expect(resolveDataLink(url, value, row, vars)).toEqual({ url: expected, unresolved: [] });
  });

  it.each([
    { name: 'field not in the row', placeholder: '${__data.fields.missing}' },
    { name: 'field not in the row, with :rison', placeholder: '${__data.fields.missing:rison}' },
    { name: 'inherited property', placeholder: '${__data.fields.constructor}' },
    { name: 'prototype', placeholder: '${__data.fields.__proto__}' },
    { name: 'unknown variable', placeholder: '$unknown' },
    { name: 'variable without variables', placeholder: '$env', vars: [] },
    { name: 'unknown suffix on a variable', placeholder: '${env:raw}' },
    { name: 'unknown suffix on the clicked value', placeholder: '${__value.text:uri}' },
  ])('keeps and reports an unresolved placeholder: $name', ({ placeholder, vars = variables }) => {
    const url = `?k=${placeholder}`;
    expect(resolveDataLink(url, 'x', row, vars)).toEqual({ url, unresolved: [placeholder] });
  });

  it('resolves the other placeholders when some cannot be resolved', () => {
    expect(
      resolveDataLink('?a=${__data.fields.missing}&b=$unknown&c=${__value.text}', 'v', row, [])
    ).toEqual({
      url: '?a=${__data.fields.missing}&b=$unknown&c=v',
      unresolved: ['${__data.fields.missing}', '$unknown'],
    });
  });

  it.each([
    {
      name: 'percent-encoded',
      url: '?v=${__value.text}&e=$env',
      value: '$env ${__value.text}',
      expected: `?v=${encodeURIComponent('$env ${__value.text}')}&e=prod`,
    },
    {
      name: 'rison',
      url: '?v=${__value.text:rison}&e=$env',
      value: '$env',
      expected: "?v='$env'&e=prod",
    },
  ])(
    'does not expand placeholders inside substituted values: $name',
    ({ url, value, expected }) => {
      expect(resolveUrl(url, value, {}, variables)).toBe(expected);
    }
  );

  it('cannot form a script URL from a value under either encoding', () => {
    for (const payload of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      expect(isNavigableDataLinkUrl(resolveUrl('${__value.text}', payload))).toBe(true);
      expect(isNavigableDataLinkUrl(resolveUrl('${__value.text:rison}', payload))).toBe(true);
      expect(
        isNavigableDataLinkUrl(resolveUrl('${__data.fields.p:rison}', 'x', { p: payload }))
      ).toBe(true);
    }
  });

  it('can complete a script scheme the template starts, which the URL check refuses', () => {
    const url = resolveUrl('${__value.text}:alert(1)', 'javascript');
    expect(url).toBe('javascript:alert(1)');
    expect(isNavigableDataLinkUrl(url)).toBe(false);
  });

  describe('round trip through the dashboard URL decoder', () => {
    it('keeps quotes, spaces, reserved characters and a multi-value variable', () => {
      const href = resolveUrl(
        '#/view/d?_a=(variables:!((id:service,current:!(${service:rison})),(id:endpoint,current:!(${__value.text:rison})),(id:path,current:!(${__data.fields["request path"]:rison})),(id:regions,current:${regions:rison})))',
        '/api/orders',
        { 'request path': 'a&b#c+d 100%' },
        [
          { name: 'service', value: "o'brien" },
          { name: 'regions', value: '', multi: true, values: ['eu west', 'foo bar'] },
        ]
      );

      expect(readDashboardState(href)).toEqual({
        variables: [
          { id: 'service', current: ["o'brien"] },
          { id: 'endpoint', current: ['/api/orders'] },
          { id: 'path', current: ['a&b#c+d 100%'] },
          { id: 'regions', current: ['eu west', 'foo bar'] },
        ],
      });
    });

    it('selects All in the target dashboard', () => {
      const href = resolveUrl(
        '#/view/x?_a=(variables:!((id:regions,current:${regions:rison})))',
        'x',
        {},
        allRegions
      );
      expect(readDashboardState(href)).toEqual({
        variables: [{ id: 'regions', current: [ALL_OPTION_VALUE] }],
      });
    });

    it('keeps the words true, false, null and numbers as strings', () => {
      // Rison writes booleans and null as !t, !f and !n; a bare `true` is an
      // identifier string, and a numeric string is quoted, so the target
      // variable always receives the cell text, never a coerced value.
      const href = resolveUrl(
        '#/view/d?_a=(variables:!((id:a,current:!(${__value.text:rison})),(id:b,current:!(${__data.fields.flag:rison})),(id:c,current:${words:rison})))',
        true,
        { flag: 'null' },
        [{ name: 'words', value: '', multi: true, values: ['false', '42'] }]
      );

      expect(readDashboardState(href)).toEqual({
        variables: [
          { id: 'a', current: ['true'] },
          { id: 'b', current: ['null'] },
          { id: 'c', current: ['false', '42'] },
        ],
      });
    });
  });
});

describe('isNavigableDataLinkUrl', () => {
  it.each(['/app/x?q=1', '#/view/x', 'https://example.org/', 'mailto:a@example.org'])(
    'allows %s',
    (url) => {
      expect(isNavigableDataLinkUrl(url)).toBe(true);
    }
  );

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    'http://[',
  ])('refuses %j', (url) => {
    expect(isNavigableDataLinkUrl(url)).toBe(false);
  });

  it.each([
    { template: '/${__value.text:rison}', value: '/evil.com' },
    { template: '${__value.text:rison}', value: '//evil.com' },
    { template: '${__data.fields.p:rison}', value: '//evil.com' },
  ])('refuses a relative template that $value moves to another host', ({ template, value }) => {
    const url = resolveUrl(template, value, { p: value });
    expect(new URL(url, 'http://base.invalid').host).toBe('evil.com');
    expect(isNavigableDataLinkUrl(url, template)).toBe(false);
  });

  it('treats a backslash like a slash when checking the host, as browsers do', () => {
    expect(isNavigableDataLinkUrl('/\\evil.com', '/${__value.text}')).toBe(false);
  });

  it.each([
    {
      name: 'relative template',
      template: '#/view/x?_a=(v:!(${__value.text:rison}))',
      value: '/api/orders',
    },
    { name: 'relative path', template: '/app/x/${__value.text}', value: '/evil.com' },
    {
      name: 'absolute template with a host from the row',
      template: 'https://${__data.fields.p}/x',
      value: 'example.org',
    },
  ])('allows a $name', ({ template, value }) => {
    expect(isNavigableDataLinkUrl(resolveUrl(template, value, { p: value }), template)).toBe(true);
  });
});
