/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// jsdom does not implement IntersectionObserver. Tests get a mock that
// immediately fires the callback with isIntersecting: true so components
// that defer rendering until visible work out of the box.
// Tests that need fine-grained control should override this with
// jest.spyOn or reassign window.IntersectionObserver in beforeEach.

class IntersectionObserver {
  constructor(callback) {
    this._callback = callback;
  }

  observe(element) {
    // Immediately report the element as intersecting
    this._callback([{ isIntersecting: true, target: element }], this);
  }

  unobserve() {}
  disconnect() {}
}

module.exports = IntersectionObserver;
