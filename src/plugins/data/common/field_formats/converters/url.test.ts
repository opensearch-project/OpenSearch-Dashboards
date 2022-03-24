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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { UrlFormat } from './url';
import { TEXT_CONTEXT_TYPE, HTML_CONTEXT_TYPE } from '../content_types';

describe('UrlFormat', () => {
  test('outputs a simple <a> tag by default', () => {
    const url = new UrlFormat({});

    expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
      '<span ng-non-bindable><a href="http://opensearch.org" target="_blank" rel="noopener noreferrer">http://opensearch.org</a></span>'
    );
  });

  test('outputs an <audio> if type === "audio"', () => {
    const url = new UrlFormat({ type: 'audio' });

    expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
      '<span ng-non-bindable><audio controls preload="none" src="http://opensearch.org"></span>'
    );
  });

  describe('outputs an <image> if type === "img"', () => {
    test('default', () => {
      const url = new UrlFormat({ type: 'img' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:none; max-height:none;"></span>'
      );
    });

    test('with correct width and height set', () => {
      const url = new UrlFormat({ type: 'img', width: '12', height: '55' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:12px; max-height:55px;"></span>'
      );
    });

    test('with correct width and height set if no width specified', () => {
      const url = new UrlFormat({ type: 'img', height: '55' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:none; max-height:55px;"></span>'
      );
    });

    test('with correct width and height set if no height specified', () => {
      const url = new UrlFormat({ type: 'img', width: '22' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:22px; max-height:none;"></span>'
      );
    });

    test('only accepts valid numbers for width', () => {
      const url = new UrlFormat({ type: 'img', width: 'not a number' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:none; max-height:none;"></span>'
      );
    });

    test('only accepts valid numbers for height', () => {
      const url = new UrlFormat({ type: 'img', height: 'not a number' });

      expect(url.convert('http://opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><img src="http://opensearch.org" alt="A dynamically-specified image located at http://opensearch.org" ' +
          'style="width:auto; height:auto; max-width:none; max-height:none;"></span>'
      );
    });
  });

  describe('url template', () => {
    test('accepts a template', () => {
      const url = new UrlFormat({ urlTemplate: 'http://{{ value }}' });

      expect(url.convert('url', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><a href="http://url" target="_blank" rel="noopener noreferrer">http://url</a></span>'
      );
    });

    test('only outputs the url if the contentType === "text"', () => {
      const url = new UrlFormat({});

      expect(url.convert('url', TEXT_CONTEXT_TYPE)).toBe('url');
    });
  });

  describe('label template', () => {
    test('accepts a template', () => {
      const url = new UrlFormat({
        labelTemplate: 'extension: {{ value }}',
        urlTemplate: 'http://www.{{value}}.com',
      });

      expect(url.convert('php', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><a href="http://www.php.com" target="_blank" rel="noopener noreferrer">extension: php</a></span>'
      );
    });

    test('uses the label template for text formating', () => {
      const url = new UrlFormat({ labelTemplate: 'external {{value }}' });

      expect(url.convert('url', TEXT_CONTEXT_TYPE)).toBe('external url');
    });

    test('can use the raw value', () => {
      const url = new UrlFormat({
        labelTemplate: 'external {{value}}',
      });

      expect(url.convert('url?', TEXT_CONTEXT_TYPE)).toBe('external url?');
    });

    test('can use the url', () => {
      const url = new UrlFormat({
        urlTemplate: 'http://google.com/{{value}}',
        labelTemplate: 'external {{url}}',
      });

      expect(url.convert('url?', TEXT_CONTEXT_TYPE)).toBe('external http://google.com/url%3F');
    });
  });

  describe('templating', () => {
    test('ignores unknown variables', () => {
      const url = new UrlFormat({ urlTemplate: '{{ not really a var }}' });

      expect(url.convert('url', TEXT_CONTEXT_TYPE)).toBe('');
    });

    test('does not allow executing code in variable expressions', () => {
      const url = new UrlFormat({ urlTemplate: '{{ (__dirname = true) && value }}' });

      expect(url.convert('url', TEXT_CONTEXT_TYPE)).toBe('');
    });

    describe('', () => {
      test('does not get values from the prototype chain', () => {
        const url = new UrlFormat({ urlTemplate: '{{ toString }}' });

        expect(url.convert('url', TEXT_CONTEXT_TYPE)).toBe('');
      });
    });
  });

  describe('allow-list', () => {
    test('should assume a relative url if the value is not in the allow-list without a base path', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards',
        basePath: '',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('www.opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/app/www.opensearch.org" target="_blank" rel="noopener noreferrer">www.opensearch.org</a></span>'
      );

      expect(converter('opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/app/opensearch.org" target="_blank" rel="noopener noreferrer">opensearch.org</a></span>'
      );

      expect(converter('opensearch')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/app/opensearch" target="_blank" rel="noopener noreferrer">opensearch</a></span>'
      );

      expect(converter('ftp://opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/app/ftp://opensearch.org" target="_blank" rel="noopener noreferrer">ftp://opensearch.org</a></span>'
      );
    });

    test('should assume a relative url if the value is not in the allow-list with a basepath', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards',
        basePath: '/xyz',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('www.opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/xyz/app/www.opensearch.org" target="_blank" rel="noopener noreferrer">www.opensearch.org</a></span>'
      );

      expect(converter('opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/xyz/app/opensearch.org" target="_blank" rel="noopener noreferrer">opensearch.org</a></span>'
      );

      expect(converter('opensearch')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/xyz/app/opensearch" target="_blank" rel="noopener noreferrer">opensearch</a></span>'
      );

      expect(converter('ftp://opensearch.org')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards/xyz/app/ftp://opensearch.org" target="_blank" rel="noopener noreferrer">ftp://opensearch.org</a></span>'
      );
    });

    test('should rely on parsedUrl', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards.host.com',
        basePath: '/abc',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('../app/opensearch-dashboards')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/abc/app/../app/opensearch-dashboards" target="_blank" rel="noopener noreferrer">../app/opensearch-dashboards</a></span>'
      );
    });

    test('should fail gracefully if there are no parsedUrl provided', () => {
      const url = new UrlFormat({});

      expect(url.convert('../app/opensearch-dashboards', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable>../app/opensearch-dashboards</span>'
      );

      expect(url.convert('http://www.opensearch.org', HTML_CONTEXT_TYPE)).toBe(
        '<span ng-non-bindable><a href="http://www.opensearch.org" target="_blank" rel="noopener noreferrer">http://www.opensearch.org</a></span>'
      );
    });

    test('should support multiple types of relative urls', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards.host.com',
        pathname: '/nbc/app/discover#/',
        basePath: '/nbc',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('#/foo')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/nbc/app/discover#/#/foo" target="_blank" rel="noopener noreferrer">#/foo</a></span>'
      );

      expect(converter('/nbc/app/discover#/')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/nbc/app/discover#/" target="_blank" rel="noopener noreferrer">/nbc/app/discover#/</a></span>'
      );

      expect(converter('../foo/bar')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/nbc/app/../foo/bar" target="_blank" rel="noopener noreferrer">../foo/bar</a></span>'
      );
    });

    test('should support multiple types of urls w/o basePath', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards.host.com',
        pathname: '/app/opensearch-dashboards',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('10.22.55.66')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/10.22.55.66" target="_blank" rel="noopener noreferrer">10.22.55.66</a></span>'
      );

      expect(converter('http://www.domain.name/app/opensearch-dashboards#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://www.domain.name/app/opensearch-dashboards#/dashboard/" target="_blank" rel="noopener noreferrer">http://www.domain.name/app/opensearch-dashboards#/dashboard/</a></span>'
      );

      expect(converter('/app/opensearch-dashboards')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/opensearch-dashboards" target="_blank" rel="noopener noreferrer">/app/opensearch-dashboards</a></span>'
      );

      expect(converter('opensearch-dashboards#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/opensearch-dashboards#/dashboard/" target="_blank" rel="noopener noreferrer">opensearch-dashboards#/dashboard/</a></span>'
      );

      expect(converter('#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/opensearch-dashboards#/dashboard/" target="_blank" rel="noopener noreferrer">#/dashboard/</a></span>'
      );
    });

    test('should support multiple types of urls w/o basePath from legacy app', () => {
      const parsedUrl = {
        origin: 'http://opensearch-dashboards.host.com',
        pathname: '/app/kibana',
      };
      const url = new UrlFormat({ parsedUrl });
      const converter = url.getConverterFor(HTML_CONTEXT_TYPE) as Function;

      expect(converter('10.22.55.66')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/10.22.55.66" target="_blank" rel="noopener noreferrer">10.22.55.66</a></span>'
      );

      expect(converter('http://www.domain.name/app/kibana#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://www.domain.name/app/kibana#/dashboard/" target="_blank" rel="noopener noreferrer">http://www.domain.name/app/kibana#/dashboard/</a></span>'
      );

      expect(converter('/app/kibana')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/kibana" target="_blank" rel="noopener noreferrer">/app/kibana</a></span>'
      );

      expect(converter('kibana#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/kibana#/dashboard/" target="_blank" rel="noopener noreferrer">kibana#/dashboard/</a></span>'
      );

      expect(converter('#/dashboard/')).toBe(
        '<span ng-non-bindable><a href="http://opensearch-dashboards.host.com/app/kibana#/dashboard/" target="_blank" rel="noopener noreferrer">#/dashboard/</a></span>'
      );
    });
  });
});
