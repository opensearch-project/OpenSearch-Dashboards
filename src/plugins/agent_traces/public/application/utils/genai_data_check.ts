/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../data/common';
import { createFieldMappingCheck, PPLRunner } from './field_mapping_check';

/** Every query of Agent Traces filters on this field; spans without it are not GenAI spans. */
export const GENAI_OPERATION_FIELD = 'attributes.gen_ai.operation.name';

const genAiFieldCheck = createFieldMappingCheck(`\`${GENAI_OPERATION_FIELD}\``);

/**
 * Checks whether the dataset has GenAI spans at all, that is whether `gen_ai.operation.name` is in
 * its index mapping. PPL rejects every Agent Traces query on a dataset where it is unmapped, such
 * as an APM span index of services that are not AI agents.
 */
export const ensureGenAiFieldChecked = (
  ppl: PPLRunner | undefined,
  dataset: Dataset | undefined | null,
  sourceCommand: string
): Promise<void> => genAiFieldCheck.ensureChecked(ppl, dataset, sourceCommand);

/**
 * The dataset is known to have no GenAI spans. Only true once a check reported the field missing,
 * so a check that has not run or failed for another reason never hides data.
 */
export const lacksGenAiData = (datasetId: string | undefined): boolean =>
  genAiFieldCheck.isMissing(datasetId);

/** A GenAI data check for the dataset is running. */
export const isCheckingGenAiData = (datasetId: string | undefined): boolean =>
  genAiFieldCheck.isChecking(datasetId);

/** Changes whenever a GenAI data check starts, ends or changes its result. */
export const useGenAiDataCheckVersion = (): number => genAiFieldCheck.useVersion();

/** For tests. */
export const resetGenAiDataChecks = () => genAiFieldCheck.reset();

/** For tests and callers that already know the mapping. */
export const setGenAiDataPresent = (datasetId: string, present: boolean) =>
  genAiFieldCheck.setPresent(datasetId, present);
