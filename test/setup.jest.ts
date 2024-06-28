/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test-subj' });

// https://github.com/inrupt/solid-client-authn-js/issues/1676#issuecomment-917016646
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

window.URL.createObjectURL = () => '';
HTMLCanvasElement.prototype.getContext = () => '' as any;
Element.prototype.scrollIntoView = jest.fn();
window.IntersectionObserver = (class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
} as unknown) as typeof window.IntersectionObserver;

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'random-id');

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => {
    return () => 'random_html_id';
  },
}));

jest.setTimeout(30000);
