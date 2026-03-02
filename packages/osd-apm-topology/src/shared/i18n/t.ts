/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


import { pathOr } from 'ramda';
import { DEFAULT_LOCALE, Locale, locale } from './locale';
import en from './lang/en.json';

type Messages = typeof en;

const localizedMessages: Record<Locale, Messages> = {
    [Locale.en]: en,
};

export const getLocalizedMessages = (selectedLocale: Locale): Messages =>
    localizedMessages[selectedLocale] ?? localizedMessages[DEFAULT_LOCALE];

const replaceParameters = (value: string, parameters: Array<[string, string]>): string =>
    parameters.reduce(
        (acc: string, [parameterName, parameterValue]) =>
            acc.replace(new RegExp(`{${parameterName}}`, 'g'), parameterValue),
        value,
    );

// https://stackoverflow.com/questions/47057649/typescript-string-dot-notation-of-nested-object
type PathsToStringProps<T> = T extends string
    ? []
    : {
          [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
      }[Extract<keyof T, string>];
// prettier-ignore
/* eslint-disable prettier/prettier */
type Join<T extends string[], D extends string> = T extends []
    ? never
    : T extends [infer F]
      ? F
      : T extends [infer F, ...infer R]
        ? F extends string
            ? `${F}${D}${Join<Extract<R, string[]>, D>}`
            : never
        : string;
/* eslint-enable prettier/prettier */
export type TId = Join<PathsToStringProps<Messages>, '.'>;

export const t = (
    messageId: TId,
    parameters = {},
    selectedLocale = locale,
): string => {
    const messages = getLocalizedMessages(selectedLocale);
    const messagePath = messageId.split('.');
    const message = pathOr(messageId, messagePath, messages);

    return typeof message === 'string' ? replaceParameters(message, Object.entries(parameters)) : messageId;
};
