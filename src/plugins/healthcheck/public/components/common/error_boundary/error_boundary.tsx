/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiEmptyPrompt, EuiCodeBlock, EuiSpacer, EuiCallOut, EuiText } from '@elastic/eui';

interface ErrorFallbackProps {
  error: Error;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => {
  return (
    <EuiEmptyPrompt
      iconType="alert"
      color="danger"
      title={
        <h2>
          <FormattedMessage
            id="healthcheck.errorBoundary.title"
            defaultMessage="Something went wrong"
          />
        </h2>
      }
      body={
        <>
          <p>
            <FormattedMessage
              id="healthcheck.errorBoundary.description"
              defaultMessage="An unexpected error occurred while loading the health check. Please try reloading the page or contact your administrator if the problem persists."
            />
          </p>
          <EuiSpacer size="m" />
          <EuiCallOut
            title={i18n.translate('healthcheck.errorBoundary.errorDetails', {
              defaultMessage: 'Error details',
            })}
            color="danger"
            iconType="alert"
          >
            <EuiCodeBlock
              language="text"
              fontSize="s"
              paddingSize="s"
              isCopyable
              style={{ textAlign: 'left' }}
            >
              {error.message}
              {error.stack && (
                <>
                  <EuiSpacer size="m" />
                  {i18n.translate('healthcheck.errorBoundary.stackTrace', {
                    defaultMessage: 'Stack trace:',
                  })}
                  <EuiText size="s" style={{ marginLeft: '20px' }}>
                    {error.stack}
                  </EuiText>
                </>
              )}
            </EuiCodeBlock>
          </EuiCallOut>
        </>
      }
    />
  );
};

interface HealthCheckErrorBoundaryProps {
  children: ReactNode;
}

export const HealthCheckErrorBoundary: React.FC<HealthCheckErrorBoundaryProps> = ({ children }) => {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
};
