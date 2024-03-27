/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';

export const readCertificateAuthorities = (
  listOfCertificateAuthorities: string | string[] | undefined
) => {
  let certificateAuthorities: string[] | undefined;

  const addCertificateAuthorities = (ca: string[]) => {
    if (ca && ca.length) {
      certificateAuthorities = [...(certificateAuthorities || []), ...ca];
    }
  };

  const ca = listOfCertificateAuthorities;
  if (ca) {
    const parsed: string[] = [];
    const paths = Array.isArray(ca) ? ca : [ca];
    for (const path of paths) {
      parsed.push(readFile(path));
    }
    addCertificateAuthorities(parsed);
  }

  return {
    certificateAuthorities,
  };
};

const readFile = (file: string) => {
  return readFileSync(file, 'utf8');
};
