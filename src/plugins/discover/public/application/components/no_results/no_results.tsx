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

import './no_results.scss';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';

import {
  EuiEmptyPrompt,
  EuiText,
  EuiTabbedContent,
  EuiCodeBlock,
  EuiSpacer,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  Query,
  QueryStringContract,
  SavedQuery,
  SavedQueryService,
} from '../../../../../data/public/';

interface Props {
  queryString: QueryStringContract;
  savedQuery: SavedQueryService;
  query: Query | undefined;
  timeFieldName?: string;
}

export const DiscoverNoResults = ({ queryString, query, savedQuery, timeFieldName }: Props) => {
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

  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [sampleQueries, setSampleQueries] = useState<any>([]);

  useEffect(() => {
    const fetchSavedQueries = async () => {
      const { queries: savedQueryItems } = await savedQuery.findSavedQueries('', 1000);
      setSavedQueries(
        savedQueryItems.filter((sq) => query?.language === sq.attributes.query.language)
      );
    };

    fetchSavedQueries();
  }, [setSavedQueries, query, savedQuery]);

  useEffect(() => {
    // Samples for the language
    const newSampleQueries: any = [];
    if (query?.language) {
      const languageSampleQueries = queryString.getLanguageService()?.getLanguage(query.language)
        ?.sampleQueries;
      if (Array.isArray(languageSampleQueries)) {
        newSampleQueries.push(...languageSampleQueries);
      }
    }

    // Samples for the dataset type
    if (query?.dataset?.type) {
      const datasetType = queryString.getDatasetService()?.getType(query.dataset.type);
      if (datasetType?.getSampleQueries) {
        const sampleQueriesResponse = datasetType.getSampleQueries(query.dataset, query.language);
        if (Array.isArray(sampleQueriesResponse)) {
          setSampleQueries([...sampleQueriesResponse, ...newSampleQueries]);
        } else if (sampleQueriesResponse instanceof Promise) {
          sampleQueriesResponse
            .then((datasetSampleQueries: any) => {
              if (Array.isArray(datasetSampleQueries)) {
                setSampleQueries([...datasetSampleQueries, ...newSampleQueries]);
              }
            })
            .catch((error: any) => {
              // noop
            });
        }
      }
    }
  }, [queryString, query]);

  const tabs = useMemo(() => {
    const buildSampleQueryBlock = (sampleTitle: string, sampleQuery: string) => {
      return (
        <>
          <EuiText size="s">{sampleTitle}</EuiText>
          <EuiSpacer size="s" />
          <EuiCodeBlock isCopyable>{sampleQuery}</EuiCodeBlock>
          <EuiSpacer size="s" />
        </>
      );
    };
    return [
      ...(sampleQueries.length > 0
        ? [
            {
              id: 'sample_queries',
              name: i18n.translate('discover.emptyPrompt.sampleQueries.title', {
                defaultMessage: 'Sample Queries',
              }),
              content: (
                <EuiPanel hasBorder={false} hasShadow={false}>
                  <EuiSpacer size="s" />
                  {sampleQueries
                    .slice(0, 5)
                    .map((sampleQuery: any) =>
                      buildSampleQueryBlock(sampleQuery.title, sampleQuery.query)
                    )}
                </EuiPanel>
              ),
            },
          ]
        : []),
      ...(savedQueries.length > 0
        ? [
            {
              id: 'saved_queries',
              name: i18n.translate('discover.emptyPrompt.savedQueries.title', {
                defaultMessage: 'Saved Queries',
              }),
              content: (
                <Fragment>
                  <EuiSpacer />
                  {savedQueries.map((sq) =>
                    buildSampleQueryBlock(sq.id, sq.attributes.query.query as string)
                  )}
                </Fragment>
              ),
            },
          ]
        : []),
    ];
  }, [savedQueries, sampleQueries]);

  return (
    <I18nProvider>
      <>
        <EuiEmptyPrompt
          iconType="editorCodeBlock"
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
        {tabs.length > 0 && (
          <div
            className="discoverNoResults-sampleContainer"
            data-test-subj="discoverNoResultsSampleContainer"
          >
            <EuiTabbedContent tabs={tabs} />
          </div>
        )}
      </>
    </I18nProvider>
  );
};
