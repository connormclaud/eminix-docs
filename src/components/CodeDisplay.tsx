import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import gapBufferSource from '@/utils/gapBuffer.ts?raw';

type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'function' | 'operator' | 'property' | 'plain';

type Token = {
  text: string;
  type: TokenType;
};

const typeColors: Record<TokenType, string> = {
  keyword: 'text-[var(--color-keyword)]',
  string: 'text-[var(--color-string)]',
  comment: 'text-[var(--color-comment)] italic',
  number: 'text-[var(--color-number)]',
  type: 'text-[var(--color-class)]',
  function: 'text-[var(--color-function)]',
  operator: 'text-[var(--color-operator)]',
  property: 'text-[var(--color-param)]',
  plain: 'text-[var(--color-text-primary)]',
};

const typeNamePattern = /^[A-Z][A-Za-z0-9_]*/;
const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*/;

function simpleTokenize(code: string): Token[][] {
  return code.split('\n').map((line) => {
    const tokens: Token[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      const commentMatch = remaining.match(/^(\/\/.*|\/\*.*\*\/)/);
      if (commentMatch) {
        tokens.push({ text: commentMatch[1], type: 'comment' });
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      const stringMatch = remaining.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`])*`)/);
      if (stringMatch) {
        tokens.push({ text: stringMatch[1], type: 'string' });
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      const declarationMatch = remaining.match(/^(class|type|interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (declarationMatch) {
        const [, keyword, name] = declarationMatch;
        const whitespace = declarationMatch[0].slice(keyword.length, declarationMatch[0].length - name.length);
        tokens.push({ text: keyword, type: 'keyword' });
        tokens.push({ text: whitespace, type: 'plain' });
        tokens.push({ text: name, type: 'type' });
        remaining = remaining.slice(declarationMatch[0].length);
        continue;
      }

      const keywordMatch = remaining.match(
        /^(export|type|class|interface|enum|constructor|static|get|return|if|else|for|while|new|throw|const|let|extends|implements|as|from|import|typeof|instanceof|this|null|true|false|string|number|boolean|void)\b/
      );
      if (keywordMatch) {
        tokens.push({ text: keywordMatch[1], type: 'keyword' });
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      const functionMatch = remaining.match(/^(assertValid|getText|getCells|getSnapshot|ensureGap|moveGap|moveLeft|moveRight|insert|deleteBack|deleteForward|clone)\b/);
      if (functionMatch) {
        tokens.push({ text: functionMatch[1], type: 'function' });
        remaining = remaining.slice(functionMatch[1].length);
        continue;
      }

      const builtinMatch = remaining.match(/^(Math|Number|Error|Array|Pick)\b/);
      if (builtinMatch) {
        tokens.push({ text: builtinMatch[1], type: 'function' });
        remaining = remaining.slice(builtinMatch[1].length);
        continue;
      }

      const propertyMatch = remaining.match(/^(\.[A-Za-z_$][A-Za-z0-9_$]*)/);
      if (propertyMatch) {
        tokens.push({ text: '.', type: 'plain' });
        tokens.push({ text: propertyMatch[1].slice(1), type: 'property' });
        remaining = remaining.slice(propertyMatch[1].length);
        continue;
      }

      const numMatch = remaining.match(/^(\d+\.?\d*)/);
      if (numMatch) {
        tokens.push({ text: numMatch[1], type: 'number' });
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      const typeNameMatch = remaining.match(typeNamePattern);
      if (typeNameMatch) {
        tokens.push({ text: typeNameMatch[0], type: 'type' });
        remaining = remaining.slice(typeNameMatch[0].length);
        continue;
      }

      const identifierMatch = remaining.match(identifierPattern);
      if (identifierMatch) {
        tokens.push({ text: identifierMatch[0], type: 'plain' });
        remaining = remaining.slice(identifierMatch[0].length);
        continue;
      }

      const operatorMatch = remaining.match(/^(=>|===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|[-+*/=<>!&|^~%?:])/);
      if (operatorMatch) {
        tokens.push({ text: operatorMatch[1], type: 'operator' });
        remaining = remaining.slice(operatorMatch[1].length);
        continue;
      }

      tokens.push({ text: remaining[0], type: 'plain' });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
}

export default function CodeDisplay() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(gapBufferSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const tokenizedLines = simpleTokenize(gapBufferSource);

  return (
    <div className="bg-editor-mid rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-editor-dark border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-sm text-text-secondary ml-2 font-mono">gapBuffer.ts</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary bg-editor-mid hover:bg-editor-light px-3 py-1.5 rounded-lg transition-colors border border-white/10"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="code-block p-4 text-sm leading-relaxed">
          <code>
            {tokenizedLines.map((lineTokens, lineIdx) => (
              <div key={lineIdx} className="flex hover:bg-white/[0.02] -mx-4 px-4">
                <span className="inline-block w-10 text-right mr-6 text-text-secondary/30 select-none text-xs leading-relaxed flex-shrink-0">
                  {lineIdx + 1}
                </span>
                <span>
                  {lineTokens.map((token, tokIdx) => (
                    <span key={tokIdx} className={typeColors[token.type] || 'text-text-primary'}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
