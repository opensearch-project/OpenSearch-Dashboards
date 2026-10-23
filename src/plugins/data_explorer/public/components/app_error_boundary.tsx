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

import React from 'react';
import { History } from 'history';
import { EuiPageTemplate, EuiEmptyPrompt, EuiText, EuiCodeBlock } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface Props {
  children: React.ReactNode;
  history: History;
}

interface State {
  error?: Error;
}

/**
 * renderApp mounts this plugin into its own React root, so a boundary
 * elsewhere -- including core's -- cannot catch a throw from this tree; React
 * boundaries do not cross roots. Without one here an uncaught render error
 * unmounts the root and leaves an empty content area with the chrome still
 * painted, which is indistinguishable from a backend returning nothing.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {};
  private unlistenHistory?: () => void;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount() {
    // The boundary sits outside the Switch and so outlives route changes.
    // Without this it would keep showing a stale failure after the user
    // navigates somewhere that renders fine. Resetting on navigation rather
    // than keying the boundary by pathname keeps route changes from
    // remounting the whole app when nothing has failed.
    this.unlistenHistory = this.props.history.listen(() => {
      if (this.state.error) {
        this.setState({ error: undefined });
      }
    });
  }

  componentWillUnmount() {
    this.unlistenHistory?.();
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[data-explorer] render failed', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <EuiPageTemplate
        template="centeredContent"
        className="deLayout"
        pageContentProps={{ role: 'alertdialog', color: 'plain', hasBorder: false }}
      >
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={
            <h2>
              <FormattedMessage
                id="dataExplorer.appError.title"
                defaultMessage="Discover could not be displayed"
              />
            </h2>
          }
          body={
            <>
              <EuiText size="s">
                <p>
                  <FormattedMessage
                    id="dataExplorer.appError.body"
                    defaultMessage="Something went wrong while rendering this page. Reload to try again, or select a different data source."
                  />
                </p>
              </EuiText>
              <EuiCodeBlock paddingSize="s" isCopyable data-test-subj="dataExplorerAppErrorDetails">
                {error.message}
              </EuiCodeBlock>
            </>
          }
        />
      </EuiPageTemplate>
    );
  }
}
