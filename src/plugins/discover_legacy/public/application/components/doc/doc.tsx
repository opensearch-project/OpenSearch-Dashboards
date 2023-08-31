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
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiPageContent } from '@elastic/eui';
import { IndexPatternsContract } from 'src/plugins/data/public';
import { OpenSearchRequestState, useOpenSearchDocSearch } from './use_opensearch_doc_search';
import { DocViewer } from '../doc_viewer/doc_viewer';

export interface DocProps {
  /**
   * Id of the doc in OpenSearch
   */
  id: string;
  /**
   * Index in OpenSearch to query
   */
  index: string;
  /**
   * IndexPattern ID used to get IndexPattern entity
   * that's used for adding additional fields (stored_fields, script_fields, docvalue_fields)
   */
  indexPatternId: string;
  /**
   * IndexPatternService to get a given index pattern by ID
   */
  indexPatternService: IndexPatternsContract;
}

export function Doc(props: DocProps) {
  const [reqState, hit, indexPattern] = useOpenSearchDocSearch(props);
  return (
    <I18nProvider>
      <EuiPageContent>
        {reqState === OpenSearchRequestState.NotFoundIndexPattern && (
          <EuiCallOut
            color="danger"
            data-test-subj={`doc-msg-notFoundIndexPattern`}
            iconType="alert"
            title={
              <FormattedMessage
                id="discover.doc.failedToLocateIndexPattern"
                defaultMessage="No index pattern matches ID {indexPatternId}"
                values={{ indexPatternId: props.indexPatternId }}
              />
            }
          />
        )}
        {reqState === OpenSearchRequestState.NotFound && (
          <EuiCallOut
            color="danger"
            data-test-subj={`doc-msg-notFound`}
            iconType="alert"
            title={
              <FormattedMessage
                id="discover.doc.failedToLocateDocumentDescription"
                defaultMessage="Cannot find document"
              />
            }
          >
            <FormattedMessage
              id="discover.doc.couldNotFindDocumentsDescription"
              defaultMessage="No documents match that ID."
            />
          </EuiCallOut>
        )}

        {reqState === OpenSearchRequestState.Error && (
          <EuiCallOut
            color="danger"
            data-test-subj={`doc-msg-error`}
            iconType="alert"
            title={
              <FormattedMessage
                id="discover.doc.failedToExecuteQueryDescription"
                defaultMessage="Cannot run search"
              />
            }
          >
            <FormattedMessage
              id="discover.doc.somethingWentWrongDescription"
              defaultMessage="{indexName} is missing."
              values={{ indexName: props.index }}
            />{' '}
            <EuiLink
              href={`https://opensearch.org/docs/latest/opensearch/rest-api/index-apis/exists/`}
              target="_blank"
            >
              <FormattedMessage
                id="discover.doc.somethingWentWrongDescriptionAddon"
                defaultMessage="Please ensure the index exists."
              />
            </EuiLink>
          </EuiCallOut>
        )}

        {reqState === OpenSearchRequestState.Loading && (
          <EuiCallOut data-test-subj={`doc-msg-loading`}>
            <EuiLoadingSpinner size="m" />{' '}
            <FormattedMessage id="discover.doc.loadingDescription" defaultMessage="Loading…" />
          </EuiCallOut>
        )}

        {reqState === OpenSearchRequestState.Found && hit !== null && indexPattern && (
          <div data-test-subj="doc-hit">
            <DocViewer hit={hit} indexPattern={indexPattern} />
          </div>
        )}
      </EuiPageContent>
    </I18nProvider>
  );
}
