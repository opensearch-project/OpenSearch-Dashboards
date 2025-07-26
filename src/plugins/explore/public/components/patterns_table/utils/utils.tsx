/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DELIM_START, MARK_END, MARK_START, STD_DELIM_END, UNIQ_DELIM_END } from './constants';

// Checks if the value is a valid, finite number. Used for patterns table
export const isValidFiniteNumber = (val: number) => {
  return !isNaN(val) && isFinite(val);
};

/**
 * Highlights dynamic elements in a log string based on a pattern string.
 *
 * This function takes a log string and a pattern string containing delimiters (e.g., <*>) that mark
 * where dynamic content appears. It identifies the dynamic parts of the log by comparing it with the pattern,
 * and wraps those dynamic elements with <mark> tags for visual highlighting in the UI.
 *
 * The strategy uses a two-pointer approach that traverses both the log and pattern strings simultaneously.
 * It identifies static text in the pattern, locates that same text in the log using a sliding window, and
 * marks everything in between as dynamic content. The algorithm handles both standard delimiters (<*>)
 * and specialized delimiters (e.g., <*IP*>, <*DATETIME*>) to accommodate different types of dynamic content.
 */
export const highlightLogUsingPattern = (log: string, pattern: string) => {
  // start with:
  // two pointers for the sample log string and the pattern string
  // an accumulator: string that we're building w/ <mark>

  // go start off in the pattern string.
  // look for a dynamic element, keeping every character before that dynamic element
  // when we find dynamic element, add the prev chars in the accumulation
  // add a <mark> to the accumulation.

  // continue on the pattern string, keeping track of every char before next dynam. elem.
  // when we reach dynam. elem., use the kept track of chars as our window.
  // on the sample log, from where we left off, slide the window down until it matches.
  // everything between first pointer and start of window is our dynam. elem. in the sample
  // add sample dynam elem to accum. and close off with </mark>.
  // add the contents of our window to the accum.

  // continue those last few steps until we reach the end.

  let currSampleLogPos = 0;
  let currPatternPos = 0;

  let markedPattern = '';

  while (currPatternPos < pattern.length) {
    // on a new cycle, in the pattern we have a big static element, in the sample we have dynamic then static
    // move down pattern until we reach a new delim, add everything until then to the static

    // below loop checks for the delim start
    const prevPatternPos = currPatternPos;
    for (; currPatternPos < pattern.length; currPatternPos++) {
      // don't need to worry about currPatternPos + 2 going over pattern length, slice will handle it
      const potentialDelim = pattern.slice(currPatternPos, currPatternPos + 2);

      if (potentialDelim === DELIM_START) {
        break;
      }
    }

    // grab the window of chars in the pattern before the delim. this will be a static element
    const preDelimWindow = pattern.slice(prevPatternPos, currPatternPos);
    currPatternPos += 2; // found the delim start, stop right in the middle

    // move down sample string, and check if the window matches at all
    const prevSampleLogPos = currSampleLogPos;
    for (; currSampleLogPos < log.length; currSampleLogPos++) {
      const potentialWindowMatch = log.slice(
        currSampleLogPos,
        currSampleLogPos + preDelimWindow.length
      );

      if (potentialWindowMatch === preDelimWindow) {
        break;
      }
    }

    const dynamicElement = log.slice(prevSampleLogPos, currSampleLogPos);

    // below statement moves the patternPos up to the end of the delim
    if (pattern[currPatternPos] === STD_DELIM_END) {
      // standard delimiter, for <*>
      currPatternPos += 1;
    } else {
      // for special delimiters, such as <*IP*> or <*DATETIME*>. ignores content of delim
      while (
        currPatternPos < pattern.length &&
        pattern.slice(currPatternPos, currPatternPos + 2) !== UNIQ_DELIM_END
      ) {
        currPatternPos++;
      }
      currPatternPos += 2; // move up one for the slice above being true, another to start on next char
    }

    // move samplePos up past preDelimWindow
    currSampleLogPos += preDelimWindow.length;

    if (dynamicElement.length !== 0) markedPattern += MARK_START + dynamicElement + MARK_END;
    markedPattern += preDelimWindow;
  }

  // check to see if our currSampleLogPos is at the length of the log.length
  // if it is, we know that the preDelimWindow is the last section of the sample log.
  // otherwise, there must be another delimiter at the end of the log.
  // simply mark the last section.
  if (currSampleLogPos !== log.length) {
    markedPattern += MARK_START + log.slice(currSampleLogPos) + MARK_END;
  }

  return markedPattern;
};
