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

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';

import { EuiEmptyPrompt, EuiPanel, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface Props {
  timeFieldName?: string;
  queryLanguage?: string;
}

export const DiscoverNoResults = ({ timeFieldName, queryLanguage }: Props) => {
  // Commented out due to no usage in code
  // See: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8149
  //
  // let luceneQueryMessage;
  //
  // if (queryLanguage === 'lucene') {
  //   const searchExamples = [
  //     {
  //       description: <EuiCode>200</EuiCode>,
  //       title: (
  //         <EuiText size="s">
  //           <strong>
  //             <FormattedMessage
  //               id="discover.noResults.searchExamples.anyField200StatusCodeExampleTitle"
  //               defaultMessage="Find requests that contain the number 200, in any field"
  //             />
  //           </strong>
  //         </EuiText>
  //       ),
  //     },
  //     {
  //       description: <EuiCode>status:200</EuiCode>,
  //       title: (
  //         <EuiText size="s">
  //           <strong>
  //             <FormattedMessage
  //               id="discover.noResults.searchExamples.statusField200StatusCodeExampleTitle"
  //               defaultMessage="Find 200 in the status field"
  //             />
  //           </strong>
  //         </EuiText>
  //       ),
  //     },
  //     {
  //       description: <EuiCode>status:[400 TO 499]</EuiCode>,
  //       title: (
  //         <EuiText size="s">
  //           <strong>
  //             <FormattedMessage
  //               id="discover.noResults.searchExamples.400to499StatusCodeExampleTitle"
  //               defaultMessage="Find all status codes between 400-499"
  //             />
  //           </strong>
  //         </EuiText>
  //       ),
  //     },
  //     {
  //       description: <EuiCode>status:[400 TO 499] AND extension:PHP</EuiCode>,
  //       title: (
  //         <EuiText size="s">
  //           <strong>
  //             <FormattedMessage
  //               id="discover.noResults.searchExamples.400to499StatusCodeWithPhpExtensionExampleTitle"
  //               defaultMessage="Find status codes 400-499 with the extension php"
  //             />
  //           </strong>
  //         </EuiText>
  //       ),
  //     },
  //     {
  //       description: <EuiCode>status:[400 TO 499] AND (extension:php OR extension:html)</EuiCode>,
  //       title: (
  //         <EuiText size="s">
  //           <strong>
  //             <FormattedMessage
  //               id="discover.noResults.searchExamples.400to499StatusCodeWithPhpOrHtmlExtensionExampleTitle"
  //               defaultMessage="Find status codes 400-499 with the extension php or html"
  //             />
  //           </strong>
  //         </EuiText>
  //       ),
  //     },
  //   ];
  //
  //   luceneQueryMessage = (
  //     <Fragment>
  //       <EuiSpacer size="xl" />
  //
  //       <EuiText size="s">
  //         <h3>
  //           <FormattedMessage
  //             id="discover.noResults.searchExamples.refineYourQueryTitle"
  //             defaultMessage="Refine your query"
  //           />
  //         </h3>
  //
  //         <p>
  //           <FormattedMessage
  //             id="discover.noResults.searchExamples.howTosearchForWebServerLogsDescription"
  //             defaultMessage="The search bar at the top uses OpenSearch&rsquo;s support for Lucene {queryStringSyntaxLink}.
  //               Here are some examples of how you can search for web server logs that have been parsed into a few fields."
  //             values={{
  //               queryStringSyntaxLink: (
  //                 <EuiLink
  //                   target="_blank"
  //                   href={getServices().docLinks.links.opensearch.queryDSL.base}
  //                 >
  //                   <FormattedMessage
  //                     id="discover.noResults.searchExamples.queryStringSyntaxLinkText"
  //                     defaultMessage="Query String syntax"
  //                   />
  //                 </EuiLink>
  //               ),
  //             }}
  //           />
  //         </p>
  //       </EuiText>
  //
  //       <EuiSpacer size="m" />
  //
  //       <EuiDescriptionList type="column" listItems={searchExamples} />
  //
  //       <EuiSpacer size="xl" />
  //     </Fragment>
  //   );
  // }

  return (
    <I18nProvider>
      <EuiPanel hasBorder={false} hasShadow={false} color="transparent">
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="default"
          data-test-subj="discoverNoResults"
          title={
            <EuiText size="s">
              <h2>
                {i18n.translate('discover.emptyPrompt.title', {
                  defaultMessage: 'No Results',
                })}
              </h2>
            </EuiText>
          }
          body={
            <EuiText size="s" data-test-subj="discoverNoResultsTimefilter">
              <p>
                {i18n.translate('discover.emptyPrompt.body', {
                  defaultMessage:
                    'Try selecting a different data source, expanding your time range or modifying the query & filters.',
                })}
              </p>
            </EuiText>
          }
        />
      </EuiPanel>
    </I18nProvider>
  );
};
