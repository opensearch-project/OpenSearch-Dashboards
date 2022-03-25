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

/* eslint-disable */

import angular from 'angular';

export function initBindHtml() {
  angular
    .module('ui.bootstrap.bindHtml', [])

    .directive('bindHtmlUnsafe', function() {
      return function(scope, element, attr) {
        element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
        scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
          element.html(value || '');
        });
      };
    });
}
