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

import classNames from 'classnames';
import React, { PureComponent } from 'react';
import MarkdownIt from 'markdown-it';
import { memoize } from 'lodash';
import { getSecureRelForTarget } from '@elastic/eui';

import './index.scss';
/**
 * Return a memoized markdown rendering function that use the specified
 * whiteListedRules (deprecated) (use allowListedRules) and openLinksInNewTab configurations.
 * @param {Array of Strings} whiteListedRules - allow list of markdown rules
 * @param {Array of Strings} allowListedRules - allow list of markdown rules
 * list of rules can be found at https://github.com/markdown-it/markdown-it/issues/361
 * @param {Boolean} openLinksInNewTab
 * @return {Function} Returns an Object to use with dangerouslySetInnerHTML
 * with the rendered markdown HTML
 */
export const markdownFactory = memoize(
  (
    whiteListedRules: string[] = [],
    allowListedRules: string[] = [],
    openLinksInNewTab: boolean = false
  ) => {
    let markdownIt: MarkdownIt;

    // It is imperative that the html config property be set to false, to mitigate XSS: the output of markdown-it is
    // fed directly to the DOM via React's dangerouslySetInnerHTML below.

    markdownIt = new MarkdownIt('zero', { html: false, linkify: true });

    if (allowListedRules && allowListedRules.length > 0) {
      markdownIt.enable(allowListedRules);
    } else if (whiteListedRules && whiteListedRules.length > 0) {
      markdownIt.enable(whiteListedRules);
    } else {
      markdownIt = new MarkdownIt({ html: false, linkify: true });
    }

    if (openLinksInNewTab) {
      // All links should open in new browser tab.
      // Define custom renderer to add 'target' attribute
      // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
      const originalLinkRender =
        markdownIt.renderer.rules.link_open ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options);
        };
      markdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const href = tokens[idx].attrGet('href');
        const target = '_blank';
        const rel = getSecureRelForTarget({ href: href === null ? undefined : href, target });

        // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
        tokens[idx].attrPush(['target', target]);
        if (rel) {
          tokens[idx].attrPush(['rel', rel]);
        }
        return originalLinkRender(tokens, idx, options, env, self);
      };
    }
    /**
     * This method is used to render markdown from the passed parameter
     * into HTML. It will just return an empty string when the markdown is empty.
     * @param {String} markdown - The markdown String
     * @return {String} - Returns the rendered HTML as string.
     */
    return (markdown: string) => {
      return markdown ? markdownIt.render(markdown) : '';
    };
  },
  (
    whiteListedRules: string[] = [],
    allowListedRules: string[] = [],
    openLinksInNewTab: boolean = false
  ) => {
    return whiteListedRules.length > 0
      ? `${whiteListedRules.join('_')}${openLinksInNewTab}`
      : `${allowListedRules.join('_')}${openLinksInNewTab}`;
  }
);

export interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  markdown?: string;
  openLinksInNewTab?: boolean;
  /** @deprecated use allowListedRules: */
  whiteListedRules?: string[];
  allowListedRules?: string[];
}

export class Markdown extends PureComponent<MarkdownProps> {
  render() {
    const {
      className,
      markdown = '',
      openLinksInNewTab,
      whiteListedRules,
      allowListedRules,
      ...rest
    } = this.props;

    const classes = classNames('osdMarkdown__body', className);
    const markdownRenderer = markdownFactory(whiteListedRules, allowListedRules, openLinksInNewTab);
    const renderedMarkdown = markdownRenderer(markdown);
    return (
      <div
        {...rest}
        className={classes}
        /*
         * Justification for dangerouslySetInnerHTML:
         * The Markdown Visualization is, believe it or not, responsible for rendering Markdown.
         * This relies on `markdown-it` to produce safe and correct HTML.
         */
        dangerouslySetInnerHTML={{ __html: renderedMarkdown }} // eslint-disable-line react/no-danger
      />
    );
  }
}

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default Markdown;
