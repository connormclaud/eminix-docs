import { useState, useCallback } from 'react';
import { Copy, Check, FileCode2 } from 'lucide-react';
import gapBufferSource from '@/utils/gapBuffer.ts?raw';

type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'type'
  | 'function'
  | 'operator'
  | 'property'
  | 'plain';

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
  let inBlockComment = false;

  return code.split('\n').map((line) => {
    const tokens: Token[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      if (inBlockComment) {
        const endIdx = remaining.indexOf('*/');
        if (endIdx === -1) {
          tokens.push({ text: remaining, type: 'comment' });
          remaining = '';
        } else {
          tokens.push({ text: remaining.slice(0, endIdx + 2), type: 'comment' });
          remaining = remaining.slice(endIdx + 2);
          inBlockComment = false;
        }
        continue;
      }

      if (remaining.startsWith('/*')) {
        const endIdx = remaining.indexOf('*/', 2);
        if (endIdx === -1) {
          tokens.push({ text: remaining, type: 'comment' });
          remaining = '';
          inBlockComment = true;
        } else {
          tokens.push({ text: remaining.slice(0, endIdx + 2), type: 'comment' });
          remaining = remaining.slice(endIdx + 2);
        }
        continue;
      }

      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) {
        tokens.push({ text: commentMatch[1], type: 'comment' });
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      const stringMatch = remaining.match(
        /^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`])*`)/
      );
      if (stringMatch) {
        tokens.push({ text: stringMatch[1], type: 'string' });
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      const declarationMatch = remaining.match(
        /^(class|type|interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/
      );
      if (declarationMatch) {
        const [, keyword, name] = declarationMatch;
        const whitespace = declarationMatch[0].slice(
          keyword.length,
          declarationMatch[0].length - name.length
        );
        tokens.push({ text: keyword, type: 'keyword' });
        tokens.push({ text: whitespace, type: 'plain' });
        tokens.push({ text: name, type: 'type' });
        remaining = remaining.slice(declarationMatch[0].length);
        continue;
      }

      const fnDeclMatch = remaining.match(/^(function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (fnDeclMatch) {
        const [, keyword, name] = fnDeclMatch;
        const whitespace = fnDeclMatch[0].slice(
          keyword.length,
          fnDeclMatch[0].length - name.length
        );
        tokens.push({ text: keyword, type: 'keyword' });
        tokens.push({ text: whitespace, type: 'plain' });
        tokens.push({ text: name, type: 'function' });
        remaining = remaining.slice(fnDeclMatch[0].length);
        continue;
      }

      const keywordMatch = remaining.match(
        /^(export|type|class|interface|enum|function|constructor|static|get|return|if|else|for|of|in|while|switch|case|break|continue|new|throw|const|let|extends|implements|as|from|import|typeof|instanceof|this|null|undefined|true|false|string|number|boolean|void)\b/
      );
      if (keywordMatch) {
        tokens.push({ text: keywordMatch[1], type: 'keyword' });
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      const builtinMatch = remaining.match(/^(Math|Number|Error|Array|Set|Map|Pick|Record)\b/);
      if (builtinMatch) {
        tokens.push({ text: builtinMatch[1], type: 'function' });
        remaining = remaining.slice(builtinMatch[1].length);
        continue;
      }

      const propertyMatch = remaining.match(/^(\.[A-Za-z_$][A-Za-z0-9_$]*)/);
      if (propertyMatch) {
        tokens.push({ text: '.', type: 'plain' });
        const propName = propertyMatch[1].slice(1);
        const afterProp = remaining.slice(propertyMatch[1].length);
        tokens.push({
          text: propName,
          type: afterProp.startsWith('(') ? 'function' : 'property',
        });
        remaining = afterProp;
        continue;
      }

      const callMatch = remaining.match(/^([a-z_$][A-Za-z0-9_$]*)(?=\s*\()/);
      if (callMatch) {
        tokens.push({ text: callMatch[1], type: 'function' });
        remaining = remaining.slice(callMatch[1].length);
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

      const operatorMatch = remaining.match(
        /^(=>|===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?|[-+*/=<>!&|^~%?:])/
      );
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

type CodeDisplayProps = {
  source?: string;
  filename?: string;
};

export default function CodeDisplay({
  source = gapBufferSource,
  filename = 'gapBuffer.ts',
}: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [source]);

  const tokenizedLines = simpleTokenize(source);

  return (
    <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-editor-dark border-b border-white/8">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode2 size={16} className="text-cursor shrink-0" />
          <span className="text-sm text-text-primary font-mono truncate">{filename}</span>
          <span className="text-xs text-text-secondary/60 font-mono tabular-nums whitespace-nowrap shrink-0">
            · {tokenizedLines.length} lines
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-editor-mid hover:bg-editor-light px-3 py-1.5 rounded-lg transition-colors border border-white/10 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          {copied ? <Check size={14} className="text-cursor" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>

      <div className="overflow-x-auto bg-code-bg">
        <pre className="code-block p-4 text-sm leading-relaxed">
          <code>
            {tokenizedLines.map((lineTokens, lineIdx) => (
              <div key={lineIdx} className="flex hover:bg-white/[0.025] -mx-4 px-4">
                <span className="inline-block w-10 text-right mr-6 text-text-secondary/40 select-none text-xs leading-relaxed shrink-0 tabular-nums">
                  {lineIdx + 1}
                </span>
                <span>
                  {lineTokens.map((token, tokIdx) => (
                    <span
                      key={tokIdx}
                      className={typeColors[token.type] || 'text-text-primary'}
                    >
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
