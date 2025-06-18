export interface TokenizerSettings {
  lowercase?: boolean;
  vocabContent?: string | string[];
  container?: any;
}

export interface Token {
  token: string;
  start: number;
  end: number;
  type: string;
}

export interface TokenizeWordResult {
  tokens: string[];
  ids: number[];
}

export interface TokenizeSentenceResult {
  ids: number[];
  offsets: [number, number][];
  tokens: string[];
}

export class BertWordPieceTokenizer {
  public lowercase: boolean;
  public configuration: {
    clsToken: string;
    maskToken: string;
    padToken: string;
    sepToken: string;
    unkToken: string;
  };
  public tokenPositions: {
    clsToken: number;
    maskToken: number;
    padToken: number;
    sepToken: number;
    unkToken: number;
    [key: string]: number;
  };
  public words: Record<string, number> = {};
  public extra: Record<string, number> = {};
  public affixes: Record<string, number> = {};
  public affixMaxLength: number = 0;
  public numWords: number = 0;
  public numExtra: number = 0;

  constructor(settings: TokenizerSettings = {}) {
    this.lowercase = settings.lowercase || false;
    this.configuration = {
      clsToken: '[CLS]',
      maskToken: '[MASK]',
      padToken: '[PAD]',
      sepToken: '[SEP]',
      unkToken: '[UNK]',
    };
    this.tokenPositions = {
      clsToken: 101,
      maskToken: 103,
      padToken: 0,
      sepToken: 102,
      unkToken: 100,
    };
    if (settings.vocabContent) {
      this.loadDictionary(settings.vocabContent);
    }
  }

  loadDictionary(inputVocabContent: string | string[]): void {
    let vocabContent = inputVocabContent;
    if (typeof vocabContent === 'string') {
      vocabContent = vocabContent.split(/\r?\n/);
    }
    this.words = {};
    this.extra = {};
    this.affixes = {};
    this.affixMaxLength = 0;
    for (let i = 0; i < vocabContent.length; i += 1) {
      const word = vocabContent[i];
      this.words[word] = i;
      if (word.startsWith('##')) {
        const affix = word.slice(2);
        if (affix.length > this.affixMaxLength) {
          this.affixMaxLength = affix.length;
        }
        this.affixes[affix] = i;
      }
    }
    this.numWords = Object.keys(this.words).length;
    this.numExtra = 0;
    Object.keys(this.configuration).forEach((tokenName) => {
      const key = tokenName as keyof typeof this.configuration;
      this.tokenPositions[tokenName] = this.words[this.configuration[key]];
    });
  }

  createToken(text: string, start: number, srcType?: string): Token {
    let type = srcType;
    if (!type) {
      type = ['\r', '\n', ' ', '\t'].includes(text) ? 'space' : 'separator';
    }
    return {
      token: text,
      start,
      end: start + text.length - 1,
      type,
    };
  }

  splitSentence(str: string): Token[] {
    const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const result: Token[] = [];
    const regex = /\W+/g;
    let match: RegExpExecArray | null;
    let lastEnd = 0;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(normalized))) {
      const chars = match[0].split('');
      for (let i = 0; i < chars.length; i += 1) {
        const token = this.createToken(chars[i], match.index + i);
        if (token.start > lastEnd) {
          const wordToken = this.createToken(str.slice(lastEnd, token.start), lastEnd, 'word');
          result.push(wordToken);
        }
        result.push(token);
        lastEnd = token.end + 1;
      }
    }
    if (lastEnd < str.length) {
      result.push(this.createToken(str.slice(lastEnd, str.length), lastEnd, 'word'));
    }
    return result;
  }

  getBestPrefix(word: string): string | undefined {
    const maxLength = Math.min(word.length - 1, this.affixMaxLength);

    // we try searching from shortest to longest.
    for (let i = maxLength; i > 0; i -= 1) {
      const current = word.substring(0, i);
      if (this.words[current]) {
        return current;
      }
    }
    return undefined;
  }

  getBestAffix(word: string): string | undefined {
    const maxLength = Math.min(word.length, this.affixMaxLength);

    // we try searching from shortest to longest.
    for (let i = maxLength; i > 0; i -= 1) {
      const current = word.substring(0, i);
      if (this.affixes[current]) {
        return current;
      }
    }
    return undefined;
  }

  tokenizeWord(srcWord: string, useExtra = false, isInside = false): TokenizeWordResult {
    const word = this.lowercase ? srcWord.toLowerCase() : srcWord;
    const result: TokenizeWordResult = {
      tokens: [],
      ids: [],
    };

    if (srcWord.length === 0) {
      return result;
    }

    const wordIndex = isInside ? this.affixes[word] : this.words[word];
    if (wordIndex !== undefined) {
      result.tokens.push((isInside ? '##' : '') + word);
      result.ids.push(wordIndex);
      return result;
    }

    // this might be in the prefixes part
    const bestPart = isInside ? this.getBestAffix(word) : this.getBestPrefix(word);

    if (!bestPart) {
      if (useExtra) {
        const index = this.numWords + this.numExtra;
        this.extra[word] = index;
        this.numExtra += 1;
        result.tokens.push(word);
        result.ids.push(index);
      } else {
        result.tokens.push(this.configuration.unkToken);
        result.ids.push(this.tokenPositions.unkToken);
      }
      return result;
    }
    const newWord = word.substring(bestPart.length);
    const newWordTokens = this.tokenizeWord(newWord, useExtra, true);

    const text = bestPart;
    result.tokens.push((isInside ? '##' : '') + text);
    result.ids.push(isInside ? this.affixes[text] : this.words[text]);

    for (let i = 0; i < newWordTokens.tokens.length; i += 1) {
      result.tokens.push(newWordTokens.tokens[i]);
      result.ids.push(newWordTokens.ids[i]);
    }
    return result;
  }

  tokenizeSentence(sentence: string, useExtra = false): TokenizeSentenceResult {
    const result: TokenizeSentenceResult = {
      ids: [],
      offsets: [],
      tokens: [],
    };
    if (!sentence) {
      return result;
    }
    const sentenceTokens = this.splitSentence(sentence);
    for (let i = 0; i < sentenceTokens.length; i += 1) {
      const currentToken = sentenceTokens[i];
      if (currentToken.type !== 'space') {
        let { start } = currentToken;
        const wordTokens = this.tokenizeWord(currentToken.token, useExtra);
        for (let j = 0; j < wordTokens.tokens.length; j += 1) {
          const currentValue = wordTokens.tokens[j];
          const currentValueLength = currentValue.startsWith('##')
            ? currentValue.length - 2
            : currentValue.length;
          result.ids.push(wordTokens.ids[j]);
          result.tokens.push(wordTokens.tokens[j]);
          result.offsets.push([start, start + currentValueLength]);
          start += currentValueLength;
        }
      }
    }
    return result;
  }
}
