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

import template from './timeline_help.html';
import { i18n } from '@osd/i18n';
import _ from 'lodash';
import moment from 'moment';

export function initTimelineHelpDirective(app) {
  app.directive('timelineHelp', function ($http) {
    return {
      restrict: 'E',
      template,
      controller: function ($scope) {
        $scope.functions = {
          list: [],
          details: null,
        };

        $scope.activeTab = 'funcref';
        $scope.activateTab = function (tabName) {
          $scope.activeTab = tabName;
        };

        function init() {
          $scope.opensearch = {
            invalidCount: 0,
          };

          $scope.translations = {
            nextButtonLabel: i18n.translate('timeline.help.nextPageButtonLabel', {
              defaultMessage: 'Next',
            }),
            previousButtonLabel: i18n.translate('timeline.help.previousPageButtonLabel', {
              defaultMessage: 'Previous',
            }),
            dontShowHelpButtonLabel: i18n.translate('timeline.help.dontShowHelpButtonLabel', {
              defaultMessage: `Don't show this again`,
            }),
            strongNextText: i18n.translate('timeline.help.welcome.content.strongNextText', {
              defaultMessage: 'Next',
            }),
            emphasizedEverythingText: i18n.translate(
              'timeline.help.welcome.content.emphasizedEverythingText',
              {
                defaultMessage: 'everything',
              }
            ),
            notValidAdvancedSettingsPath: i18n.translate(
              'timeline.help.configuration.notValid.advancedSettingsPathText',
              {
                defaultMessage: 'Management / OpenSearch Dashboards / Advanced Settings',
              }
            ),
            validAdvancedSettingsPath: i18n.translate(
              'timeline.help.configuration.valid.advancedSettingsPathText',
              {
                defaultMessage: 'Management/OpenSearch Dashboards/Advanced Settings',
              }
            ),
            opensearchAsteriskQueryDescription: i18n.translate(
              'timeline.help.querying.opensearchAsteriskQueryDescriptionText',
              {
                defaultMessage: 'hey OpenSearch, find everything in my default index',
              }
            ),
            opensearchIndexQueryDescription: i18n.translate(
              'timeline.help.querying.opensearchIndexQueryDescriptionText',
              {
                defaultMessage: 'use * as the q (query) for the logstash-* index',
              }
            ),
            strongAddText: i18n.translate('timeline.help.expressions.strongAddText', {
              defaultMessage: 'Add',
            }),
            twoExpressionsDescriptionTitle: i18n.translate(
              'timeline.help.expressions.examples.twoExpressionsDescriptionTitle',
              {
                defaultMessage: 'Double the fun.',
              }
            ),
            customStylingDescriptionTitle: i18n.translate(
              'timeline.help.expressions.examples.customStylingDescriptionTitle',
              {
                defaultMessage: 'Custom styling.',
              }
            ),
            namedArgumentsDescriptionTitle: i18n.translate(
              'timeline.help.expressions.examples.namedArgumentsDescriptionTitle',
              {
                defaultMessage: 'Named arguments.',
              }
            ),
            groupedExpressionsDescriptionTitle: i18n.translate(
              'timeline.help.expressions.examples.groupedExpressionsDescriptionTitle',
              {
                defaultMessage: 'Grouped expressions.',
              }
            ),
          };

          getFunctions();
          checkOpenSearch();
        }

        function getFunctions() {
          return $http.get('../api/timeline/functions').then(function (resp) {
            $scope.functions.list = resp.data;
          });
        }
        $scope.recheckOpenSearch = function () {
          $scope.opensearch.valid = null;
          checkOpenSearch().then(function (valid) {
            if (!valid) $scope.opensearch.invalidCount++;
          });
        };

        function checkOpenSearch() {
          return $http.get('../api/timeline/validate/opensearch').then(function (resp) {
            if (resp.data.ok) {
              $scope.opensearch.valid = true;
              $scope.opensearch.stats = {
                min: moment(resp.data.min).format('LLL'),
                max: moment(resp.data.max).format('LLL'),
                field: resp.data.field,
              };
            } else {
              $scope.opensearch.valid = false;
              $scope.opensearch.invalidReason = (function () {
                try {
                  const opensearchResp = JSON.parse(resp.data.resp.response);
                  return _.get(opensearchResp, 'error.root_cause[0].reason');
                } catch (e) {
                  if (_.get(resp, 'data.resp.message')) return _.get(resp, 'data.resp.message');
                  if (_.get(resp, 'data.resp.output.payload.message'))
                    return _.get(resp, 'data.resp.output.payload.message');
                  return i18n.translate('timeline.help.unknownErrorMessage', {
                    defaultMessage: 'Unknown error',
                  });
                }
              })();
            }
            return $scope.opensearch.valid;
          });
        }
        init();
      },
    };
  });
}
