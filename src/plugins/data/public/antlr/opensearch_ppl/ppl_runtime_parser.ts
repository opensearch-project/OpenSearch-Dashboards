/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ATNDeserializer,
  CharStream,
  CommonTokenStream,
  LexerInterpreter,
  ParserInterpreter,
  Lexer,
  Parser,
  ATN,
} from 'antlr4ng';
import { HttpSetup } from 'opensearch-dashboards/public';
import { PPLArtifacts } from './ppl_artifact_loader';

/**
 * Runtime parser factory that creates interpreters from artifact ATN data
 * This eliminates the need for compiled ANTLR grammar in the frontend
 */
class PPLRuntimeParserFactory {
  private artifacts: PPLArtifacts | null = null;
  private loading: Promise<PPLArtifacts | null> | null = null;

  // Cache deserialized ATNs (ATN objects, not serialized arrays)
  private lexerATNObj: ATN | null = null;
  private parserATNObj: ATN | null = null;

  private runtimeLexerFactory: ((input: CharStream) => Lexer) | null = null;
  private runtimeParserFactory: ((tokens: CommonTokenStream) => Parser) | null = null;

  private runtimeLexerClass: any = null;
  private runtimeParserClass: any = null;

  /**
   * Initialize by loading artifacts from backend
   */
  async initialize(http: HttpSetup, dataSourceId?: string): Promise<void> {
    if (this.loading) {
      console.log('[PPL Runtime Parser] Already loading, waiting...');
      await this.loading;
      return;
    }

    // If already initialized AND runtime factories exist, skip
    if (this.artifacts && this.runtimeLexerFactory && this.runtimeParserFactory) {
      console.log('[PPL Runtime Parser] Already initialized');
      return;
    }

    console.log('[PPL Runtime Parser] Fetching artifacts from backend...');
    // TODO: This factory is deprecated. Use pplGrammarCache instead.
    this.artifacts = null;
    this.loading = null;

    console.log('[PPL Runtime Parser] Artifacts loaded:', !!this.artifacts);

    if (this.artifacts) {
      console.log('[PPL Runtime Parser] Creating runtime interpreters...');
      this.createRuntimeInterpreters();
      console.log('[PPL Runtime Parser] Runtime factories created:', {
        lexerFactory: this.runtimeLexerFactory,
        parserFactory: this.runtimeParserFactory,
      });
    } else {
      console.warn('[PPL Runtime Parser] Failed to load artifacts');
    }
  }

  /**
   * Convert Uint16Array -> number[] consistently for antlr4ng deserializer
   */
  private toNumberArray(u16: Uint16Array): number[] {
    // Array.from on Uint16Array produces number[]
    return Array.from(u16);
  }

  getRuntimeLexerClass(): any {
    return this.runtimeLexerClass;
  }

  getRuntimeParserClass(): any {
    return this.runtimeParserClass;
  }

  /**
   * Deserialize ATNs ONCE and create interpreter factories.
   */
  private createRuntimeInterpreters(): void {
    if (!this.artifacts) return;

    const artifacts = this.artifacts;

    console.log('[PPL Runtime Parser] Deserializing ATN...');
    console.log('[PPL Runtime Parser] Backend grammar hash:', artifacts.grammarHash);
    console.log('[PPL Runtime Parser] Lexer serialized len:', artifacts.lexerATN);
    console.log('[PPL Runtime Parser] Parser serialized len:', artifacts.parserATN);

    // Normalize inputs
    // const lexerData = this.toNumberArray(artifacts.lexerATN);
    // const parserData = this.toNumberArray(artifacts.parserATN);

    const lexerData = artifacts.lexerATN;
    const parserData = artifacts.parserATN;

    console.log('[PPL Runtime Parser] Lexer head:', lexerData.slice(0, 10));
    console.log('[PPL Runtime Parser] Parser head:', parserData.slice(0, 10));

    // Hard guard: avoid "version undefined"
    if (lexerData.length === 0 || lexerData[0] === undefined) {
      console.error('[PPL Runtime Parser] Invalid lexer ATN data; first element is undefined/empty', {
        len: lexerData.length,
        head: lexerData.slice(0, 10),
      });
      return;
    }
    if (parserData.length === 0 || parserData[0] === undefined) {
      console.error('[PPL Runtime Parser] Invalid parser ATN data; first element is undefined/empty', {
        len: parserData.length,
        head: parserData.slice(0, 10),
      });
      return;
    }

    // Deserialize with default options
    try {
      // const deserializer = new ATNDeserializer();
      // this.lexerATNObj = deserializer.deserialize(lexerData);
      // this.parserATNObj = deserializer.deserialize(parserData);

      // const deserializer = new ATNDeserializer();
      // this.lexerATNObj = new ATNDeserializer().deserialize(lexerData);
      // this.parserATNObj = new ATNDeserializer().deserialize(parserData);
      // console.log('lexerATNObj: ', parserATNObj);
      // console.log('parserATNObj: ', parserATNObj);

      console.log('[PPL Runtime Parser] ATN deserialization successful (default options)');
    } catch (error: any) {
      console.warn('[PPL Runtime Parser] Default deserialization failed:', error?.message, error);

      // Try relaxed
      try {
        const relaxed = new ATNDeserializer({
          readOnly: false,
          verifyATN: false,
          generateRuleBypassTransitions: true,
        });
        this.lexerATNObj = relaxed.deserialize(lexerData);
        this.parserATNObj = relaxed.deserialize(parserData);

        // Build runtime Lexer/Parser classes for parseQuery() (expects constructors)
        const lexerATN = this.lexerATNObj!;
        const parserATN = this.parserATNObj!;

        this.runtimeLexerClass = class RuntimeLexer extends Lexer {
          private static _artifacts = artifacts;
          private static _atn = this.lexerATNObj!;

          constructor(input: CharStream) {
            super(input);
          }

          get atnWithBypassAlts(): ATN {
            return (this.constructor as any)._atn;
          }

          get grammarFileName(): string {
            return 'PPLLexer';
          }

          get ruleNames(): string[] {
            return (this.constructor as any)._artifacts.lexerRuleNames;
          }

          get channelNames(): string[] {
            return (this.constructor as any)._artifacts.channelNames;
          }

          get modeNames(): string[] {
            return (this.constructor as any)._artifacts.modeNames;
          }

          get vocabulary() {
            return (this.constructor as any)._artifacts.vocabulary;
          }
        };

        this.runtimeParserClass = class RuntimeParser extends Parser {
          private static _artifacts = artifacts;
          private static _atn = this.parserATNObj!;

          constructor(input: CommonTokenStream) {
            super(input);
          }

          get atnWithBypassAlts(): ATN {
            return (this.constructor as any)._atn;
          }

          get grammarFileName(): string {
            return 'PPLParser';
          }

          get ruleNames(): string[] {
            return (this.constructor as any)._artifacts.parserRuleNames;
          }

          get vocabulary() {
            return (this.constructor as any)._artifacts.vocabulary;
          }
        };


        console.log('[PPL Runtime Parser] ATN deserialization successful (relaxed options)');
      } catch (relaxedError: any) {
        console.error('[PPL Runtime Parser] ATN deserialization failed with all options');
        console.error('[PPL Runtime Parser] Error:', relaxedError?.message, relaxedError);
        console.error('[PPL Runtime Parser] Stack:', relaxedError?.stack);
        console.error('[PPL Runtime Parser] Grammar hash:', artifacts.grammarHash);
        // Clear caches to be safe
        this.lexerATNObj = null;
        this.parserATNObj = null;
        this.runtimeLexerFactory = null;
        this.runtimeParserFactory = null;
        return;
      }
    }

    if (!this.lexerATNObj || !this.parserATNObj) {
      console.error('[PPL Runtime Parser] ATN objects are null after deserialization');
      return;
    }

    // Create factories that produce interpreters (recommended for “no generated code”)
    this.runtimeLexerFactory = (input: CharStream) => {
      return new LexerInterpreter(
        'PPLLexer',
        artifacts.vocabulary,
        artifacts.lexerRuleNames,
        artifacts.channelNames,
        artifacts.modeNames,
        this.lexerATNObj!,
        input
      );
    };

    this.runtimeParserFactory = (tokens: CommonTokenStream) => {
      return new ParserInterpreter(
        'PPLParser',
        artifacts.vocabulary,
        artifacts.parserRuleNames,
        this.parserATNObj!,
        tokens
      );
    };
  }

  /**
   * Check if runtime parser is available
   */
  isInitialized(): boolean {
    const result =
      this.artifacts !== null &&
      this.lexerATNObj !== null &&
      this.parserATNObj !== null &&
      this.runtimeLexerFactory !== null &&
      this.runtimeParserFactory !== null;

    console.log('[PPL Runtime Parser] isInitialized check:', {
      hasArtifacts: this.artifacts !== null,
      hasLexerATNObj: this.lexerATNObj !== null,
      hasParserATNObj: this.parserATNObj !== null,
      hasLexerFactory: this.runtimeLexerFactory !== null,
      hasParserFactory: this.runtimeParserFactory !== null,
      result,
    });

    return result;
  }

  getArtifacts(): PPLArtifacts | null {
    return this.artifacts;
  }

  /**
   * Create a runtime lexer (interpreter)
   */
  createLexer(input: CharStream): Lexer {
    if (!this.runtimeLexerFactory) {
      throw new Error('PPL runtime lexer not initialized. Call initialize() first.');
    }
    return this.runtimeLexerFactory(input);
  }

  /**
   * Create a runtime parser (interpreter)
   */
  createParser(tokenStream: CommonTokenStream): Parser {
    if (!this.runtimeParserFactory) {
      throw new Error('PPL runtime parser not initialized. Call initialize() first.');
    }
    return this.runtimeParserFactory(tokenStream);
  }

  /**
   * Create lexer and parser for a query
   */
  createParsers(query: string): { lexer: Lexer; parser: Parser; tokenStream: CommonTokenStream } {
    const inputStream = CharStream.fromString(query);
    const lexer = this.createLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = this.createParser(tokenStream);
    return { lexer, parser, tokenStream };
  }

  getStartRuleIndex(): number {
    return this.artifacts?.startRuleIndex ?? 0;
  }

  /**
   * Force refresh artifacts
   */
  async refresh(http: HttpSetup, dataSourceId?: string): Promise<void> {
    this.clear();
    await this.initialize(http, dataSourceId);
  }

  /**
   * Clear cached artifacts
   */
  clear(): void {
    this.artifacts = null;
    this.loading = null;
    this.lexerATNObj = null;
    this.parserATNObj = null;
    this.runtimeLexerFactory = null;
    this.runtimeParserFactory = null;
  }
}

export const pplRuntimeParserFactory = new PPLRuntimeParserFactory();
