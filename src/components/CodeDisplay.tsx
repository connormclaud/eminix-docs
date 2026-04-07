import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { pythonCode } from '../data/pythonCode';
import type { Token } from '../data/pythonCode';

const typeColors: Record<Token['type'], string> = {
  keyword: 'text-[var(--color-keyword)]',
  string: 'text-[var(--color-string)]',
  function: 'text-[var(--color-function)]',
  comment: 'text-[var(--color-comment)] italic',
  number: 'text-[var(--color-number)]',
  class: 'text-[var(--color-class)]',
  operator: 'text-[var(--color-operator)]',
  param: 'text-[var(--color-param)]',
  plain: 'text-[var(--color-text-primary)]',
  decorator: 'text-[var(--color-keyword)]',
};

// Simple line-by-line tokenizer
function simpleTokenize(code: string): Token[][] {
  return code.split('\n').map(line => {
    const tokens: Token[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      // Comment
      const commentMatch = remaining.match(/^(#.*)/);
      if (commentMatch) {
        tokens.push({ text: commentMatch[1], type: 'comment' });
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      // Triple-quoted strings (single line)
      const tripleMatch = remaining.match(/^(""".*?"""|'''.*?''')/);
      if (tripleMatch) {
        tokens.push({ text: tripleMatch[1], type: 'string' });
        remaining = remaining.slice(tripleMatch[1].length);
        continue;
      }

      // Double-quoted strings
      const dqMatch = remaining.match(/^(f?"[^"]*"|"[^"]*")/);
      if (dqMatch) {
        tokens.push({ text: dqMatch[1], type: 'string' });
        remaining = remaining.slice(dqMatch[1].length);
        continue;
      }

      // Single-quoted strings
      const sqMatch = remaining.match(/^(f?'[^']*'|'[^']*')/);
      if (sqMatch) {
        tokens.push({ text: sqMatch[1], type: 'string' });
        remaining = remaining.slice(sqMatch[1].length);
        continue;
      }

      // Decorator
      const decMatch = remaining.match(/^(@\w+)/);
      if (decMatch) {
        tokens.push({ text: decMatch[1], type: 'decorator' });
        remaining = remaining.slice(decMatch[1].length);
        continue;
      }

      // def/class followed by name
      const defMatch = remaining.match(/^(def|class)\s+(\w+)/);
      if (defMatch) {
        tokens.push({ text: defMatch[1], type: 'keyword' });
        const wsEnd = defMatch[0].indexOf(defMatch[2]);
        tokens.push({ text: defMatch[0].slice(defMatch[1].length, wsEnd), type: 'plain' });
        tokens.push({ text: defMatch[2], type: 'class' });
        remaining = remaining.slice(defMatch[0].length);
        continue;
      }

      // Keywords
      const kwMatch = remaining.match(/^(class|def|if|else|elif|for|while|return|import|from|as|in|not|and|or|is|with|yield|raise|try|except|finally|pass|break|continue|None|True|False)\b/);
      if (kwMatch) {
        tokens.push({ text: kwMatch[1], type: 'keyword' });
        remaining = remaining.slice(kwMatch[1].length);
        continue;
      }

      // self
      const selfMatch = remaining.match(/^(self)\b/);
      if (selfMatch) {
        tokens.push({ text: 'self', type: 'param' });
        remaining = remaining.slice(4);
        continue;
      }

      // Built-in functions
      const funcMatch = remaining.match(/^(range|len|print|str|int|float|list|dict|tuple|set|type|min|max|super|isinstance)\b/);
      if (funcMatch) {
        tokens.push({ text: funcMatch[1], type: 'function' });
        remaining = remaining.slice(funcMatch[1].length);
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^(\d+\.?\d*)/);
      if (numMatch) {
        tokens.push({ text: numMatch[1], type: 'number' });
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      // Operators
      if ('+-*/=<>!&|^~%'.includes(remaining[0])) {
        let opEnd = 1;
        while (opEnd < remaining.length && '+-*/=<>!&|^~%'.includes(remaining[opEnd])) {
          opEnd++;
        }
        tokens.push({ text: remaining.slice(0, opEnd), type: 'operator' });
        remaining = remaining.slice(opEnd);
        continue;
      }

      // Plain character
      tokens.push({ text: remaining[0], type: 'plain' });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
}

export default function CodeDisplay() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const tokenizedLines = simpleTokenize(pythonCode);

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
          <span className="text-sm text-text-secondary ml-2 font-mono">gap_buffer.py</span>
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
