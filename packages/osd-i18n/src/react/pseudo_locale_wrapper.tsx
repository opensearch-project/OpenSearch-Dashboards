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

import * as React from 'react';
import { useIntl, RawIntlProvider, IntlShape } from 'react-intl';
import * as i18n from '../core';
import { isPseudoLocale, translateUsingPseudoLocale } from '../core/pseudo_locale';

/**
 * To translate label that includes nested `FormattedMessage` instances React Intl
 * replaces them with special placeholders (@__uid__@ELEMENT-uid-counter@__uid__@)
 * and maps them back with nested translations after `formatMessage` processes
 * original string, so we shouldn't modify these special placeholders with pseudo
 * translations otherwise React Intl won't be able to properly replace placeholders.
 * It's implementation detail of the React Intl, but since pseudo localization is dev
 * only feature we should be fine here.
 * @param message
 */
function translateFormattedMessageUsingPseudoLocale(message: string) {
  const formattedMessageDelimiter = message.match(/@__.{10}__@/);
  if (formattedMessageDelimiter !== null) {
    return message
      .split(formattedMessageDelimiter[0])
      .map((part) => (part.startsWith('ELEMENT-') ? part : translateUsingPseudoLocale(part)))
      .join(formattedMessageDelimiter[0]);
  }

  return translateUsingPseudoLocale(message);
}

interface PseudoLocaleWrapperProps {
  children: React.ReactNode;
}

/**
 * If the locale is our pseudo locale (e.g. en-xa), we override the
 * intl.formatMessage function to display scrambled characters.
 * This uses the modern RawIntlProvider from react-intl 6.x to wrap
 * the intl context with a modified formatMessage function.
 */
export const PseudoLocaleWrapper: React.FC<PseudoLocaleWrapperProps> = ({ children }) => {
  const intl = useIntl();

  const wrappedIntl = React.useMemo(() => {
    if (!isPseudoLocale(i18n.getLocale())) {
      return intl;
    }

    // Create a wrapped intl object with modified formatMessage
    return {
      ...intl,
      formatMessage: ((descriptor: any, values?: any, opts?: any) => {
        const result = intl.formatMessage(descriptor, values, opts);
        // Only translate if result is a string (not ReactNode[])
        if (typeof result === 'string') {
          return translateFormattedMessageUsingPseudoLocale(result);
        }
        return result;
      }) as IntlShape['formatMessage'],
    };
  }, [intl]);

  // If pseudo locale is not enabled, just return children
  if (!isPseudoLocale(i18n.getLocale())) {
    return <>{children}</>;
  }

  // Wrap children with RawIntlProvider to provide the modified intl context
  return <RawIntlProvider value={wrappedIntl}>{children}</RawIntlProvider>;
};
