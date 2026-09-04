/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, ParseTree } from 'antlr4ng';
import {
  buildPipelineShape,
  collectAlternateSourceSubtrees,
  PipelineStage,
} from '../../pipeline_shape';
import {
  findAllDescendantsByRule,
  findChildByRule,
  isRuleNode,
  isTerminalNode,
  RuleNameToIndex,
} from '../../rule_index';
import { ExplainOperation } from '../explain_types';
import { SourcePositionMapper, SourceSpan } from './source_positions';
import {
  EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION,
  ExplainAttributionCandidateSnapshot,
  ExplainAttributionSnapshot,
  ExplainProbeKind,
} from './snapshot';

type ExplainAliasBindingSnapshot = NonNullable<ExplainAttributionCandidateSnapshot['aliasBinding']>;

interface ParserExplainAliasBinding extends ExplainAliasBindingSnapshot {
  definitionNode: ParserRuleContext;
}

interface ParserExplainAttributionCandidate extends Omit<
  ExplainAttributionCandidateSnapshot,
  'aliasBinding' | 'filterComparison'
> {
  stageNode: ParserRuleContext;
  focusNode: ParserRuleContext;
  aliasBinding?: ParserExplainAliasBinding;
}

interface ExplainAliasReference {
  binding: ParserExplainAliasBinding;
  useNode?: ParserRuleContext;
}

export interface CandidateExtractionOptions {
  /**
   * Prefix present in parser source but absent from the editor model, used for
   * pipe-first parsing (`source=t `).
   */
  parserPrefixLength?: number;
  typeMap?: Map<string, string>;
}

const OPERATION_COMMANDS: Record<ExplainOperation, string[]> = {
  filter: ['whereCommand'],
  aggregation: ['statsCommand'],
  sort: ['sortCommand'],
};

const BRANCHED_COMMANDS = new Set([
  'joinCommand',
  'appendCommand',
  'appendcolCommand',
  'unionCommand',
  'multisearchCommand',
  'lookupCommand',
]);

const ALIAS_PRESERVING_COMMANDS = new Set([
  'whereCommand',
  'sortCommand',
  'headCommand',
  'dedupCommand',
  'reverseCommand',
  'regexCommand',
]);

function isInside(node: ParserRuleContext, roots: Set<ParserRuleContext>): boolean {
  let current: ParserRuleContext | null = node;
  while (current) {
    if (roots.has(current)) {
      return true;
    }
    current = current.parent as ParserRuleContext | null;
  }
  return false;
}

function containsRoot(node: ParserRuleContext, roots: Set<ParserRuleContext>): boolean {
  for (const root of roots) {
    let current: ParserRuleContext | null = root;
    while (current) {
      if (current === node) {
        return true;
      }
      current = current.parent as ParserRuleContext | null;
    }
  }
  return false;
}

function sortedNodes(
  nodes: ParserRuleContext[],
  mapper: SourcePositionMapper
): ParserRuleContext[] {
  return [...nodes].sort(
    (left, right) => mapper.contextSpan(left).startOffset - mapper.contextSpan(right).startOffset
  );
}

function firstNode(
  parent: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  names: string[],
  mapper: SourcePositionMapper
): ParserRuleContext | undefined {
  for (const name of names) {
    const direct = findChildByRule(parent, ruleNameToIndex, name);
    if (direct) {
      return direct;
    }
    const [descendant] = sortedNodes(
      findAllDescendantsByRule(parent, ruleNameToIndex, name),
      mapper
    );
    if (descendant) {
      return descendant;
    }
  }
  return undefined;
}

function userSpan(span: SourceSpan, prefixLength: number, queryLength: number): SourceSpan {
  return {
    startOffset: Math.max(0, Math.min(queryLength, span.startOffset - prefixLength)),
    endOffset: Math.max(0, Math.min(queryLength, span.endOffset - prefixLength)),
  };
}

function fieldName(text: string): string {
  const trimmed = text.trim().replace(/^[+-]/, '');
  return trimmed.startsWith('`') && trimmed.endsWith('`') ? trimmed.slice(1, -1) : trimmed;
}

function isUsableControlField(type: string | undefined): boolean {
  return !!type && !['text', 'object', 'nested', 'flat_object', 'binary'].includes(type);
}

function buildEvalBindings(
  stage: PipelineStage,
  bindings: Map<string, ParserExplainAliasBinding>,
  mapper: SourcePositionMapper,
  userMapper: SourcePositionMapper,
  query: string,
  prefixLength: number,
  ruleNameToIndex: RuleNameToIndex,
  typeMap?: Map<string, string>
): void {
  const clauses = sortedNodes(
    findAllDescendantsByRule(stage.node, ruleNameToIndex, 'evalClause'),
    mapper
  );
  for (const clause of clauses) {
    const fields = sortedNodes(
      findAllDescendantsByRule(clause, ruleNameToIndex, 'fieldExpression'),
      mapper
    );
    const lhs = fields[0];
    const rhs = firstNode(clause, ruleNameToIndex, ['logicalExpression', 'expression'], mapper);
    if (!lhs || !rhs) {
      continue;
    }
    const alias = fieldName(lhs.getText());
    const parserSpan = mapper.contextSpan(rhs);
    const span = userSpan(parserSpan, prefixLength, query.length);
    const baseField = fields
      .slice(1)
      .map((field) => {
        const sourceSpan = userSpan(mapper.contextSpan(field), prefixLength, query.length);
        const source = query.slice(sourceSpan.startOffset, sourceSpan.endOffset);
        return { source, name: fieldName(source) };
      })
      .find(({ name }) => isUsableControlField(typeMap?.get(name)));

    bindings.set(alias, {
      alias,
      definitionRange: userMapper.range(span.startOffset, span.endOffset),
      definitionStartOffset: span.startOffset,
      definitionEndOffset: span.endOffset,
      definitionNode: rhs,
      baseFieldSource: baseField?.source,
    });
  }
}

function updateRenameBindings(
  stage: PipelineStage,
  bindings: Map<string, ParserExplainAliasBinding>,
  mapper: SourcePositionMapper,
  ruleNameToIndex: RuleNameToIndex
): void {
  const clauses = sortedNodes(
    [
      ...findAllDescendantsByRule(stage.node, ruleNameToIndex, 'renameClasue'),
      ...findAllDescendantsByRule(stage.node, ruleNameToIndex, 'renameClause'),
    ],
    mapper
  );
  if (clauses.length !== 1) {
    bindings.clear();
    return;
  }

  const fields = sortedNodes(
    [
      ...findAllDescendantsByRule(clauses[0], ruleNameToIndex, 'renameFieldExpression'),
      ...findAllDescendantsByRule(clauses[0], ruleNameToIndex, 'wcFieldExpression'),
    ],
    mapper
  );
  if (fields.length !== 2) {
    bindings.clear();
    return;
  }

  const source = fieldName(fields[0].getText());
  const target = fieldName(fields[1].getText());
  const simpleField = /^(?:`[^`]+`|[A-Za-z_][\w.]*)$/;
  if (!simpleField.test(fields[0].getText()) || !simpleField.test(fields[1].getText())) {
    bindings.clear();
    return;
  }

  const binding = bindings.get(source);
  bindings.delete(source);
  if (binding) {
    bindings.set(target, { ...binding, alias: target });
  } else {
    // A stored field renamed over an eval alias shadows that alias.
    bindings.delete(target);
  }
}

function referencedAlias(
  node: ParserRuleContext,
  bindings: Map<string, ParserExplainAliasBinding>,
  mapper: SourcePositionMapper,
  ruleNameToIndex: RuleNameToIndex
): ExplainAliasReference | undefined {
  const matches = sortedNodes(
    findAllDescendantsByRule(node, ruleNameToIndex, 'fieldExpression'),
    mapper
  )
    .map((useNode) => ({ useNode, binding: bindings.get(fieldName(useNode.getText())) }))
    .filter(
      (match): match is { useNode: ParserRuleContext; binding: ParserExplainAliasBinding } =>
        !!match.binding
    );
  const bindingsFound = new Set(matches.map(({ binding }) => binding));
  if (bindingsFound.size !== 1) {
    return undefined;
  }
  return {
    binding: matches[0].binding,
    useNode: matches.length === 1 ? matches[0].useNode : undefined,
  };
}

function buildCandidate(
  operation: ExplainOperation,
  probeKind: ExplainProbeKind,
  stage: PipelineStage,
  focusNode: ParserRuleContext,
  mapper: SourcePositionMapper,
  userMapper: SourcePositionMapper,
  query: string,
  prefixLength: number,
  allPipeOffsets: number[],
  aliasReference?: ExplainAliasReference
): ParserExplainAttributionCandidate {
  const focus = userSpan(mapper.contextSpan(focusNode), prefixLength, query.length);
  const stageSpan = userSpan(mapper.contextSpan(stage.node), prefixLength, query.length);
  const related = aliasReference?.useNode
    ? userSpan(mapper.contextSpan(aliasReference.useNode), prefixLength, query.length)
    : undefined;
  return {
    id: `${operation}:${focus.startOffset}:${focus.endOffset}`,
    scopeId: 'outer',
    operation,
    startOffset: focus.startOffset,
    endOffset: focus.endOffset,
    stageStartOffset: stageSpan.startOffset,
    stageEndOffset: stageSpan.endOffset,
    separatorStartOffset: [...allPipeOffsets]
      .reverse()
      .find((offset) => offset < stageSpan.startOffset),
    stageRange: userMapper.range(stageSpan.startOffset, stageSpan.endOffset),
    focusRange: userMapper.range(focus.startOffset, focus.endOffset),
    relatedRange: related ? userMapper.range(related.startOffset, related.endOffset) : undefined,
    stageNode: stage.node,
    focusNode,
    probeKind,
    sourceText: query.slice(focus.startOffset, focus.endOffset),
    aliasBinding: aliasReference?.binding,
  };
}

function filterComparison(
  candidate: ParserExplainAttributionCandidate,
  mapper: SourcePositionMapper,
  userMapper: SourcePositionMapper,
  prefixLength: number,
  queryLength: number,
  ruleNameToIndex: RuleNameToIndex
): ExplainAttributionCandidateSnapshot['filterComparison'] {
  if (candidate.operation !== 'filter') {
    return undefined;
  }
  const operators = findAllDescendantsByRule(
    candidate.focusNode,
    ruleNameToIndex,
    'comparisonOperator'
  );
  if (operators.length !== 1) {
    return undefined;
  }
  const comparison = (operators[0].parent as ParserRuleContext | null) ?? operators[0];
  const span = userSpan(mapper.contextSpan(comparison), prefixLength, queryLength);
  if (
    span.startOffset < candidate.startOffset ||
    span.endOffset > candidate.endOffset ||
    span.startOffset >= span.endOffset
  ) {
    return undefined;
  }
  return {
    startOffset: span.startOffset,
    endOffset: span.endOffset,
    range: userMapper.range(span.startOffset, span.endOffset),
  };
}

function snapshotCandidate(
  candidate: ParserExplainAttributionCandidate,
  mapper: SourcePositionMapper,
  userMapper: SourcePositionMapper,
  prefixLength: number,
  queryLength: number,
  ruleNameToIndex: RuleNameToIndex
): ExplainAttributionCandidateSnapshot {
  const { aliasBinding } = candidate;
  const plainBinding = aliasBinding
    ? {
        alias: aliasBinding.alias,
        definitionRange: aliasBinding.definitionRange,
        definitionStartOffset: aliasBinding.definitionStartOffset,
        definitionEndOffset: aliasBinding.definitionEndOffset,
        baseFieldSource: aliasBinding.baseFieldSource,
      }
    : undefined;
  return {
    id: candidate.id,
    scopeId: candidate.scopeId,
    operation: candidate.operation,
    probeKind: candidate.probeKind,
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
    stageStartOffset: candidate.stageStartOffset,
    stageEndOffset: candidate.stageEndOffset,
    separatorStartOffset: candidate.separatorStartOffset,
    stageRange: candidate.stageRange,
    focusRange: candidate.focusRange,
    relatedRange: candidate.relatedRange,
    sourceText: candidate.sourceText,
    aliasBinding: plainBinding,
    filterComparison: filterComparison(
      candidate,
      mapper,
      userMapper,
      prefixLength,
      queryLength,
      ruleNameToIndex
    ),
  };
}

function pipeOffsets(
  tree: ParserRuleContext,
  mapper: SourcePositionMapper,
  prefixLength: number,
  queryLength: number
): number[] {
  const offsets: number[] = [];
  const visit = (node: ParseTree): void => {
    if (isTerminalNode(node)) {
      if (node.getText() === '|') {
        offsets.push(
          userSpan(mapper.tokenSpan(node.symbol), prefixLength, queryLength).startOffset
        );
      }
      return;
    }
    if (isRuleNode(node)) {
      (node.children ?? []).forEach(visit);
    }
  };
  visit(tree);
  return offsets.sort((left, right) => left - right);
}

/**
 * Build a source-ordered index for the outer pipeline. Unsupported independent
 * scopes fail closed for every explain operation because the plan has no source
 * provenance that can distinguish their outcomes.
 */
export function buildExplainAttributionSnapshot(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  parserSource: string,
  options: CandidateExtractionOptions = {}
): ExplainAttributionSnapshot {
  const prefixLength = options.parserPrefixLength ?? 0;
  const query = parserSource.slice(prefixLength);
  const mapper = new SourcePositionMapper(parserSource);
  const userMapper = new SourcePositionMapper(query);
  const pipelinePipeOffsets = pipeOffsets(tree, mapper, prefixLength, query.length);
  const alternateSubtrees = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  const allStages = buildPipelineShape(tree, ruleNameToIndex).stages;
  const outerStages = allStages
    .filter((stage) => !isInside(stage.node, alternateSubtrees))
    .sort(
      (left, right) =>
        mapper.contextSpan(left.node).startOffset - mapper.contextSpan(right.node).startOffset
    );
  const unsupportedOperations = new Set<ExplainOperation>();

  if (
    alternateSubtrees.size > 0 ||
    outerStages.some((stage) => BRANCHED_COMMANDS.has(stage.command)) ||
    allStages.some((stage) => isInside(stage.node, alternateSubtrees))
  ) {
    unsupportedOperations.add('filter');
    unsupportedOperations.add('aggregation');
    unsupportedOperations.add('sort');
  }

  const aggregationStages = outerStages.filter((stage) =>
    ['statsCommand', 'eventstatsCommand', 'streamstatsCommand', 'timechartCommand'].includes(
      stage.command
    )
  );
  if (
    aggregationStages.length !== 1 ||
    aggregationStages.some((stage) => stage.command !== 'statsCommand')
  ) {
    unsupportedOperations.add('aggregation');
  }
  if (outerStages.filter((stage) => stage.command === 'sortCommand').length !== 1) {
    unsupportedOperations.add('sort');
  }

  const alternateOperationCommands = new Set(
    allStages
      .filter((stage) => isInside(stage.node, alternateSubtrees))
      .map((stage) => stage.command)
  );
  for (const operation of Object.keys(OPERATION_COMMANDS) as ExplainOperation[]) {
    if (OPERATION_COMMANDS[operation].some((command) => alternateOperationCommands.has(command))) {
      unsupportedOperations.add(operation);
    }
  }

  const candidates: ParserExplainAttributionCandidate[] = [];
  const bindings = new Map<string, ParserExplainAliasBinding>();

  for (const stage of outerStages) {
    if (stage.command === 'evalCommand') {
      buildEvalBindings(
        stage,
        bindings,
        mapper,
        userMapper,
        query,
        prefixLength,
        ruleNameToIndex,
        options.typeMap
      );
      continue;
    }
    if (stage.command === 'renameCommand') {
      updateRenameBindings(stage, bindings, mapper, ruleNameToIndex);
      continue;
    }
    if (!ALIAS_PRESERVING_COMMANDS.has(stage.command)) {
      // Commands that can reshape or create fields invalidate the reaching
      // definition unless they have a dedicated binding transfer above.
      bindings.clear();
    }

    if (stage.command === 'whereCommand') {
      if (containsRoot(stage.node, alternateSubtrees)) {
        unsupportedOperations.add('filter');
        continue;
      }
      const focus = firstNode(
        stage.node,
        ruleNameToIndex,
        ['logicalExpression', 'expression'],
        mapper
      );
      if (focus) {
        candidates.push(
          buildCandidate(
            'filter',
            'filter-term',
            stage,
            focus,
            mapper,
            userMapper,
            query,
            prefixLength,
            pipelinePipeOffsets,
            referencedAlias(focus, bindings, mapper, ruleNameToIndex)
          )
        );
      }
      continue;
    }

    if (stage.command === 'statsCommand') {
      const terms = sortedNodes(
        findAllDescendantsByRule(stage.node, ruleNameToIndex, 'statsAggTerm'),
        mapper
      );
      terms.forEach((term) =>
        candidates.push(
          buildCandidate(
            'aggregation',
            'aggregate-term',
            stage,
            term,
            mapper,
            userMapper,
            query,
            prefixLength,
            pipelinePipeOffsets
          )
        )
      );
      continue;
    }

    if (stage.command === 'sortCommand') {
      const keys = sortedNodes(
        findAllDescendantsByRule(stage.node, ruleNameToIndex, 'sortField'),
        mapper
      );
      keys.forEach((key) =>
        candidates.push(
          buildCandidate(
            'sort',
            'sort-key',
            stage,
            key,
            mapper,
            userMapper,
            query,
            prefixLength,
            pipelinePipeOffsets,
            referencedAlias(key, bindings, mapper, ruleNameToIndex)
          )
        )
      );
    }
  }

  candidates.sort((left, right) => left.startOffset - right.startOffset);
  return {
    protocolVersion: EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION,
    queryLength: query.length,
    candidates: candidates.map((item) =>
      snapshotCandidate(item, mapper, userMapper, prefixLength, query.length, ruleNameToIndex)
    ),
    unsupportedOperations: (['filter', 'aggregation', 'sort'] as ExplainOperation[]).filter(
      (operation) => unsupportedOperations.has(operation)
    ),
  };
}
