// The Python GapBuffer implementation for students
export const pythonCode = `class GapBuffer:
    """
    A simplified Gap Buffer data structure for text editors.

    A gap buffer uses a single array with a "gap" (unused space)
    where the cursor sits. Insertions at the cursor are O(1) because
    we just fill the gap. Moving the cursor means shifting the gap.

    ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
    │ H │ e │ l │   │   │   │ l │ o │ ! │   │  <-- buffer
    └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                ^^^^^^^^^
                  GAP
    (Cursor is here, between "l" and "l")
    """

    def __init__(self, capacity=1024):
        # The actual storage array
        self.buffer = [''] * capacity
        # Where the gap starts (cursor position in the text)
        self.gap_start = 0
        # Where the gap ends
        self.gap_end = capacity

    def _move_gap(self, new_pos):
        """Move the gap so that cursor is at new_pos in the text."""
        if new_pos == self.gap_start:
            return  # Already in the right spot

        if new_pos > self.gap_start:
            # Move gap right: shift characters from right side into gap
            distance = new_pos - self.gap_start
            for i in range(distance):
                self.buffer[self.gap_end] = self.buffer[self.gap_start]
                self.buffer[self.gap_start] = ''
                self.gap_start += 1
                self.gap_end += 1
        else:
            # Move gap left: shift characters from left side into gap
            distance = self.gap_start - new_pos
            for i in range(distance):
                self.gap_start -= 1
                self.gap_end -= 1
                self.buffer[self.gap_start] = self.buffer[self.gap_end]
                self.buffer[self.gap_end] = ''

    def insert(self, text):
        """Insert text at the current cursor position."""
        if self.gap_end - self.gap_start < len(text):
            self._grow(len(text))

        for char in text:
            self.buffer[self.gap_start] = char
            self.gap_start += 1

    def delete(self, count):
        """Delete 'count' characters before the cursor."""
        # Make sure we have enough gap to hold deleted chars
        # Actually, deleting means expanding the gap backwards
        chars_to_delete = min(count, self.gap_start)
        for _ in range(chars_to_delete):
            self.gap_start -= 1
            self.buffer[self.gap_start] = ''

    def delete_forward(self, count):
        """Delete 'count' characters after the cursor (forward delete)."""
        chars_after = len(self.buffer) - self.gap_end
        chars_to_delete = min(count, chars_after)
        for _ in range(chars_to_delete):
            self.buffer[self.gap_end] = ''
            self.gap_end += 1

    def left(self):
        """Move cursor one position left."""
        if self.gap_start > 0:
            self._move_gap(self.gap_start - 1)

    def right(self):
        """Move cursor one position right."""
        if self.gap_start < self.length():
            self._move_gap(self.gap_start + 1)

    def length(self):
        """Return the length of the text (excluding the gap)."""
        return len(self.buffer) - (self.gap_end - self.gap_start)

    def get_text(self):
        """Get the full text content (no gaps)."""
        return ''.join(self.buffer[:self.gap_start]
                       + self.buffer[self.gap_end:])

    def _grow(self, needed):
        """Grow the buffer when the gap is too small."""
        new_size = len(self.buffer) * 2 + needed
        new_buffer = [''] * new_size
        # Copy text before gap
        for i in range(self.gap_start):
            new_buffer[i] = self.buffer[i]
        # Copy text after gap
        old_gap_size = self.gap_end - self.gap_start
        new_gap_size = new_size - self.length()
        new_gap_start = self.gap_start
        new_gap_end = new_gap_start + new_gap_size
        text_after = self.gap_end
        new_text_after = new_gap_end
        old_len = len(self.buffer)
        while text_after < old_len:
            new_buffer[new_text_after] = self.buffer[text_after]
            text_after += 1
            new_text_after += 1
        self.buffer = new_buffer
        self.gap_end = new_gap_end


# ============================================
#  EXAMPLE USAGE — Try this out!
# ============================================

if __name__ == "__main__":
    gb = GapBuffer(capacity=20)

    # Simulate typing "Hello World"
    for char in "Hello World":
        gb.insert(char)
    print(gb.get_text())  # "Hello World"

    # Move cursor left 5 times (before "World")
    for _ in range(5):
        gb.left()

    # Insert "Beautiful " before "World"
    gb.insert("Beautiful ")
    print(gb.get_text())  # "Hello Beautiful World"

    # Delete "Beautiful " (10 chars)
    gb.delete(10)
    print(gb.get_text())  # "Hello World"
`;

// Tokenized version for syntax highlighting
export interface Token {
  text: string;
  type: 'keyword' | 'string' | 'function' | 'comment' | 'number' | 'class' | 'operator' | 'param' | 'plain' | 'decorator';
}

export function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    // Check for full-line comments
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith('#')) {
      tokens.push({ text: line, type: 'comment' });
      continue;
    }

    // Check for docstrings (triple-quoted)
    if (trimmedStart.startsWith('"""') || trimmedStart.startsWith("'''")) {
      const quote = trimmedStart.slice(0, 3);
      let inDocstring = false;
      const afterQuote = trimmedStart.slice(3);
      if (afterQuote.includes(quote)) {
        tokens.push({ text: line, type: 'string' });
        continue;
      }
      tokens.push({ text: line, type: 'string' });
      inDocstring = true;
      while (inDocstring && lines.indexOf(line) < lines.length - 1) {
        line; // skip
        break;
      }
      continue;
    }

    // Tokenize line by line using regex
    tokenizeLine(line, tokens);
  }

  return tokens;
}

function tokenizeLine(line: string, tokens: Token[]): void {
  let remaining = line;

  const patterns: [RegExp, Token['type']][] = [
    [/^(#.*)$/, 'comment'],
    [/^(""".*?"""|\'\'\'.*?\'\'\')/, 'string'],
    [/^(f?"[^"]*"|f?'[^']*')/, 'string'],
    [/^(@\w+)/, 'decorator'],
    [/^(class|def|if|else|elif|for|while|return|import|from|as|in|not|and|or|is|with|yield|raise|try|except|finally|pass|break|continue|self|None|True|False)\b/, 'keyword'],
    [/^(range|len|print|str|int|float|list|dict|tuple|set|type|min|max|super|isinstance)\b/, 'function'],
    [/^(\d+\.?\d*)/, 'number'],
  ];

  while (remaining.length > 0) {
    let matched = false;

    // Check for identifiers (function/class names after def/class)
    const defMatch = remaining.match(/^(def|class)\s+(\w+)/);
    if (defMatch && defMatch.index === 0) {
      tokens.push({ text: defMatch[1], type: 'keyword' });
      tokens.push({ text: ' '.repeat(defMatch[0].indexOf(defMatch[2]) - defMatch[1].length), type: 'plain' });
      tokens.push({ text: defMatch[2], type: 'class' });
      remaining = remaining.slice(defMatch[0].length);
      matched = true;
      continue;
    }

    // Check for self.param
    const selfMatch = remaining.match(/^(self)\b/);
    if (selfMatch && selfMatch.index === 0) {
      tokens.push({ text: 'self', type: 'param' });
      remaining = remaining.slice(4);
      matched = true;
      continue;
    }

    for (const [regex, type] of patterns) {
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        tokens.push({ text: match[0], type });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check for operators
      if ('+-*/=<>!&|^~%'.includes(remaining[0])) {
        // Collect consecutive operators
        let opEnd = 1;
        while (opEnd < remaining.length && '+-*/=<>!&|^~%'.includes(remaining[opEnd])) {
          opEnd++;
        }
        tokens.push({ text: remaining.slice(0, opEnd), type: 'operator' });
        remaining = remaining.slice(opEnd);
      } else {
        tokens.push({ text: remaining[0], type: 'plain' });
        remaining = remaining.slice(1);
      }
    }
  }

  tokens.push({ text: '\n', type: 'plain' });
}
