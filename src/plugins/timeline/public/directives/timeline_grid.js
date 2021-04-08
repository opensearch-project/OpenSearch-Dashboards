/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import $ from 'jquery';

export function initTimelineGridDirective(app) {
  app.directive('timelineGrid', function () {
    return {
      restrict: 'A',
      scope: {
        timelineGridRows: '=',
        timelineGridColumns: '=',
      },
      link: function ($scope, $elem) {
        function init() {
          setDimensions();
        }

        $scope.$on('$destroy', function () {
          $(window).off('resize'); //remove the handler added earlier
        });

        $(window).resize(function () {
          setDimensions();
        });

        $scope.$watchMulti(['timelineGridColumns', 'timelineGridRows'], function () {
          setDimensions();
        });

        function setDimensions() {
          const borderSize = 2;
          const headerSize = 45 + 35 + 28 + 20 * 2; // chrome + subnav + buttons + (container padding)
          const verticalPadding = 10;

          if ($scope.timelineGridColumns != null) {
            $elem.width($elem.parent().width() / $scope.timelineGridColumns - borderSize * 2);
          }

          if ($scope.timelineGridRows != null) {
            $elem.height(
              ($(window).height() - headerSize) / $scope.timelineGridRows -
                (verticalPadding + borderSize * 2)
            );
          }
        }

        init();
      },
    };
  });
}
