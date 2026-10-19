/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-script-url */

import { getStateFromOsdUrl } from '../../../../../opensearch_dashboards_utils/public';
import { ALL_OPTION_VALUE, VariableValue } from '../../../../../dashboard/public';
import { isNavigableDataLinkUrl, resolveDataLink, resolveDataLinkUrl } from './data_link_utils';

/** Reads _a the way the dashboard app does from a link relative to it. */
const readDashboardState = (href: string) =>
  getStateFromOsdUrl('_a', `http://localhost/app/dashboards${href}`);

describe('resolveDataLinkUrl', () => {
  const row = {
    service: 'checkout',
    'request path': '/api/orders',
    'resource.service.name': 'cart',
    empty: null,
    nested: { a: 1 },
  };
  const variables: VariableValue[] = [
    { name: 'env', value: 'prod' },
    { name: 'regions', value: 'eu,us', multi: true, values: ['eu west', 'us'] },
  ];

  it('replaces the clicked value', () => {
    expect(resolveDataLinkUrl('https://x?q=${__value.text}', 'a b')).toBe('https://x?q=a%20b');
  });

  it('replaces every occurrence, not only the first', () => {
    expect(resolveDataLinkUrl('/${__value.text}/${__value.text}', 'v')).toBe('/v/v');
  });

  it('replaces a row field with dot syntax', () => {
    expect(resolveDataLinkUrl('?s=${__data.fields.service}', 'x', row)).toBe('?s=checkout');
  });

  it('replaces a row field whose name contains dots', () => {
    expect(resolveDataLinkUrl('?s=${__data.fields.resource.service.name}', 'x', row)).toBe(
      '?s=cart'
    );
  });

  it('replaces a row field with bracket syntax, double or single quotes', () => {
    expect(resolveDataLinkUrl('?p=${__data.fields["request path"]}', 'x', row)).toBe(
      '?p=%2Fapi%2Forders'
    );
    expect(resolveDataLinkUrl("?p=${__data.fields['request path']}", 'x', row)).toBe(
      '?p=%2Fapi%2Forders'
    );
  });

  it('keeps the placeholder for a field that is not in the row', () => {
    expect(resolveDataLinkUrl('?m=${__data.fields.missing}', 'x', row)).toBe(
      '?m=${__data.fields.missing}'
    );
  });

  it('gives an empty string for a null field and stringifies objects', () => {
    expect(resolveDataLinkUrl('?e=${__data.fields.empty}', 'x', row)).toBe('?e=');
    expect(resolveDataLinkUrl('?n=${__data.fields.nested}', 'x', row)).toBe(
      `?n=${encodeURIComponent('{"a":1}')}`
    );
    expect(resolveDataLinkUrl('?v=${__value.text}', { b: 2 })).toBe(
      `?v=${encodeURIComponent('{"b":2}')}`
    );
  });

  it('replaces dashboard variables in both forms', () => {
    expect(resolveDataLinkUrl('?e=$env&f=${env}', 'x', {}, variables)).toBe('?e=prod&f=prod');
  });

  it('joins the values of a multi-value variable, each encoded', () => {
    expect(resolveDataLinkUrl('?r=$regions', 'x', {}, variables)).toBe('?r=eu%20west,us');
  });

  it('carries the All marker, not the expanded options, when All is selected', () => {
    const all: VariableValue[] = [
      { name: 'regions', value: 'eu,us', multi: true, values: ['eu', 'us'], isAll: true },
    ];
    expect(resolveDataLinkUrl('?r=$regions', 'x', {}, all)).toBe(
      `?r=${encodeURIComponent(ALL_OPTION_VALUE)}`
    );
    expect(resolveDataLinkUrl('?r=${regions:rison}', 'x', {}, all)).toBe(
      `?r=!('${ALL_OPTION_VALUE}')`
    );
  });

  it('round-trips an All selection into the target dashboard state', () => {
    const href = resolveDataLinkUrl(
      '#/view/x?_a=(variables:!((id:regions,current:${regions:rison})))',
      'x',
      {},
      [{ name: 'regions', value: '', multi: true, values: ['eu', 'us'], isAll: true }]
    );
    expect(readDashboardState(href)).toEqual({
      variables: [{ id: 'regions', current: [ALL_OPTION_VALUE] }],
    });
  });

  it('reports the placeholders it could not resolve', () => {
    expect(
      resolveDataLink('?a=${__data.fields.missing}&b=$unknown&c=${__value.text}', 'v', row, [])
    ).toEqual({
      url: '?a=${__data.fields.missing}&b=$unknown&c=v',
      unresolved: ['${__data.fields.missing}', '$unknown'],
    });
    expect(resolveDataLink('?e=$env', 'v', row, variables).unresolved).toEqual([]);
  });

  it('cannot form a script URL from a cell value under either encoding', () => {
    for (const payload of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      for (const url of [
        resolveDataLinkUrl('${__value.text}', payload),
        resolveDataLinkUrl('${__value.text:rison}', payload),
        resolveDataLinkUrl('${__data.fields.p:rison}', 'x', { p: payload }),
      ]) {
        expect(isNavigableDataLinkUrl(url)).toBe(true);
        expect(new URL(url, 'http://base.invalid').protocol).toBe('http:');
      }
    }
  });

  it('keeps an unknown variable, and $var when there are no variables', () => {
    expect(resolveDataLinkUrl('?u=$unknown', 'x', {}, variables)).toBe('?u=$unknown');
    expect(resolveDataLinkUrl('?e=$env', 'x')).toBe('?e=$env');
  });

  it('does not expand placeholders inside substituted values', () => {
    expect(
      resolveDataLinkUrl('?v=${__value.text}&e=$env', '$env ${__value.text}', {}, variables)
    ).toBe(`?v=${encodeURIComponent('$env ${__value.text}')}&e=prod`);
  });

  it('encodes reserved characters', () => {
    expect(resolveDataLinkUrl('?v=${__value.text}', 'a&b#c/d e')).toBe('?v=a%26b%23c%2Fd%20e');
  });

  it('tells navigable URLs from script schemes', () => {
    expect(isNavigableDataLinkUrl('/app/x?q=1')).toBe(true);
    expect(isNavigableDataLinkUrl('#/view/x')).toBe(true);
    expect(isNavigableDataLinkUrl('https://example.org/')).toBe(true);
    expect(isNavigableDataLinkUrl('mailto:a@example.org')).toBe(true);
    expect(isNavigableDataLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isNavigableDataLinkUrl(' JaVaScRiPt:alert(1)')).toBe(false);
    expect(isNavigableDataLinkUrl('java\tscript:alert(1)')).toBe(false);
    expect(isNavigableDataLinkUrl('data:text/html,x')).toBe(false);
    expect(isNavigableDataLinkUrl('vbscript:x')).toBe(false);
  });

  it('keeps a URL without placeholders unchanged', () => {
    expect(resolveDataLinkUrl('https://example.com/a?b=c', 'x', row, variables)).toBe(
      'https://example.com/a?b=c'
    );
  });

  it('percent-encodes when there is no :rison suffix', () => {
    expect(resolveDataLinkUrl('?v=${__value.text}', "o'brien /x")).toBe("?v=o'brien%20%2Fx");
    expect(resolveDataLinkUrl('?v=${__value.text:uri}', '/api/orders')).toBe(
      '?v=${__value.text:uri}'
    );
  });

  it('rison-encodes a :rison suffix without percent-encoding the value', () => {
    expect(resolveDataLinkUrl('current:!(${__value.text:rison})', '/api/orders')).toBe(
      'current:!(/api/orders)'
    );
    expect(resolveDataLinkUrl('${__value.text:rison}', 'foo bar')).toBe("'foo+bar'");
    expect(resolveDataLinkUrl('${__value.text:rison}', "o'brien")).toBe("'o!'brien'");
    expect(resolveDataLinkUrl('${__value.text:rison}', 'a!b')).toBe("'a!!b'");
    expect(resolveDataLinkUrl('?p=${__data.fields["request path"]:rison}', 'x', row)).toBe(
      '?p=/api/orders'
    );
    expect(resolveDataLinkUrl('?s=${__data.fields.resource.service.name:rison}', 'x', row)).toBe(
      '?s=cart'
    );
    expect(resolveDataLinkUrl('?e=$env:rison', 'x', {}, variables)).toBe('?e=prod');
  });

  it('rison-encodes a multi-value variable as one array', () => {
    expect(resolveDataLinkUrl('current:${regions:rison}', 'x', {}, variables)).toBe(
      "current:!('eu+west',us)"
    );
  });

  it('keeps a colon in a field name that is not a :rison suffix', () => {
    const colonRow = { 'http:status': 200, 'a:rison': 'colon' };
    expect(resolveDataLinkUrl('?s=${__data.fields.http:status}', 'x', colonRow)).toBe('?s=200');
    expect(resolveDataLinkUrl('?s=${__data.fields["a:rison"]}', 'x', colonRow)).toBe('?s=colon');
  });

  it('leaves an unknown suffix in place', () => {
    expect(resolveDataLinkUrl('?e=${env:raw}', 'x', {}, variables)).toBe('?e=${env:raw}');
    expect(resolveDataLinkUrl('?m=${__data.fields.missing:rison}', 'x', row)).toBe(
      '?m=${__data.fields.missing:rison}'
    );
  });

  it('does not expand a rison value that itself contains a placeholder', () => {
    expect(resolveDataLinkUrl('?v=${__value.text:rison}&e=$env', '$env', {}, variables)).toBe(
      "?v='$env'&e=prod"
    );
  });

  it('round-trips a dashboard link through the URL parser and rison.decode', () => {
    const href = resolveDataLinkUrl(
      '#/view/endpoint-dashboard?_a=(variables:!((id:service,current:!(${service:rison})),(id:endpoint,current:!(${__value.text:rison}))))',
      '/api/orders',
      {},
      [{ name: 'service', value: "o'brien" }]
    );

    expect(readDashboardState(href)).toEqual({
      variables: [
        { id: 'service', current: ["o'brien"] },
        { id: 'endpoint', current: ['/api/orders'] },
      ],
    });
  });

  it('round-trips spaces, reserved characters, and a multi-value variable', () => {
    const href = resolveDataLinkUrl(
      '#/view/endpoint-dashboard?_a=(variables:!((id:service,current:!(${service:rison})),(id:path,current:!(${__data.fields["request path"]:rison})),(id:regions,current:${regions:rison})))',
      'x',
      { 'request path': 'a&b#c+d 100%' },
      [
        { name: 'service', value: 'foo bar' },
        { name: 'regions', value: 'eu,us', multi: true, values: ['eu west', "o'brien"] },
      ]
    );

    expect(readDashboardState(href)).toEqual({
      variables: [
        { id: 'service', current: ['foo bar'] },
        { id: 'path', current: ['a&b#c+d 100%'] },
        { id: 'regions', current: ['eu west', "o'brien"] },
      ],
    });
  });

  it('keeps the words true, false, null and numbers as strings through rison', () => {
    // Rison writes booleans and null as !t, !f and !n; a bare `true` is an
    // identifier string, and a numeric string is quoted, so the target
    // variable always receives the cell text, never a coerced value.
    const href = resolveDataLinkUrl(
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
