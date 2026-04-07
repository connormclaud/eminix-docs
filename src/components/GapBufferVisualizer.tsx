import { useState, useCallback } from 'react';
import { ChevronLeft, Eraser, Type, ArrowLeft, ArrowRight } from 'lucide-react';

// A visual, interactive Gap Buffer implementation for the browser
class GapBufferViz {
  buffer: (string | null)[];
  gapStart: number;
  gapEnd: number;

  constructor(capacity: number = 20) {
    this.buffer = new Array(capacity).fill(null);
    this.gapStart = 0;
    this.gapEnd = capacity;
  }

  get length() {
    return this.buffer.length - (this.gapEnd - this.gapStart);
  }

  get gapSize() {
    return this.gapEnd - this.gapStart;
  }

  moveGap(newPos: number) {
    if (newPos === this.gapStart) return;
    if (newPos > this.gapStart) {
      const dist = newPos - this.gapStart;
      for (let i = 0; i < dist; i++) {
        this.buffer[this.gapEnd] = this.buffer[this.gapStart];
        this.buffer[this.gapStart] = null;
        this.gapStart++;
        this.gapEnd++;
      }
    } else {
      const dist = this.gapStart - newPos;
      for (let i = 0; i < dist; i++) {
        this.gapStart--;
        this.gapEnd--;
        this.buffer[this.gapStart] = this.buffer[this.gapEnd];
        this.buffer[this.gapEnd] = null;
      }
    }
  }

  insert(text: string) {
    for (const char of text) {
      this.buffer[this.gapStart] = char;
      this.gapStart++;
    }
  }

  deleteBack(count: number) {
    const toDelete = Math.min(count, this.gapStart);
    for (let i = 0; i < toDelete; i++) {
      this.gapStart--;
      this.buffer[this.gapStart] = null;
    }
  }

  deleteForward(count: number) {
    const textAfter = this.buffer.length - this.gapEnd;
    const toDelete = Math.min(count, textAfter);
    for (let i = 0; i < toDelete; i++) {
      this.buffer[this.gapEnd] = null;
      this.gapEnd++;
    }
  }

  moveLeft() {
    if (this.gapStart > 0) this.moveGap(this.gapStart - 1);
  }

  moveRight() {
    if (this.gapStart < this.length) this.moveGap(this.gapStart + 1);
  }

  getText() {
    return this.buffer.filter((_, i) => i < this.gapStart || i >= this.gapEnd).join('');
  }

  getCells() {
    return this.buffer.map((val, i) => ({
      index: i,
      char: val,
      isGap: i >= this.gapStart && i < this.gapEnd,
      isBeforeGap: i === this.gapStart - 1,
      isAfterGap: i === this.gapEnd,
    }));
  }
}

export type OperationLog = {
  type: 'insert' | 'delete' | 'move-left' | 'move-right';
  description: string;
  complexity: string;
};

const GAP_BUFFER_SIZE = 16;

export default function GapBufferVisualizer() {
  const [gb, setGb] = useState<GapBufferViz>(() => new GapBufferViz(GAP_BUFFER_SIZE));
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [inputText, setInputText] = useState('');
  const [deleteCount, setDeleteCount] = useState(1);
  const [highlightCells, setHighlightCells] = useState<Set<number>>(new Set());

  const addLog = useCallback((type: OperationLog['type'], description: string, complexity: string) => {
    setLogs(prev => [...prev.slice(-19), { type, description, complexity }]);
  }, []);

  const handleInsert = useCallback(() => {
    if (!inputText) return;
    setGb(prev => {
      const next = new GapBufferViz(GAP_BUFFER_SIZE);
      next.buffer = [...prev.buffer];
      next.gapStart = prev.gapStart;
      next.gapEnd = prev.gapEnd;
      next.insert(inputText);
      // Highlight changed cells
      const changed = new Set<number>();
      for (let i = 0; i < inputText.length; i++) {
        changed.add(prev.gapStart + i);
      }
      setHighlightCells(changed);
      setTimeout(() => setHighlightCells(new Set()), 1200);
      return next;
    });
    addLog('insert', `Inserted "${inputText}" at cursor (gap)`, 'O(n) where n = chars inserted');
    setInputText('');
  }, [inputText, addLog]);

  const handleDelete = useCallback(() => {
    setGb(prev => {
      const next = new GapBufferViz(GAP_BUFFER_SIZE);
      next.buffer = [...prev.buffer];
      next.gapStart = prev.gapStart;
      next.gapEnd = prev.gapEnd;
      next.deleteBack(deleteCount);
      const changed = new Set<number>();
      for (let i = 0; i < deleteCount; i++) {
        changed.add(prev.gapStart - 1 - i);
      }
      setHighlightCells(changed);
      setTimeout(() => setHighlightCells(new Set()), 1200);
      return next;
    });
    addLog('delete', `Deleted ${deleteCount} char(s) before cursor`, 'O(n) where n = chars deleted');
  }, [deleteCount, addLog]);

  const handleDeleteForward = useCallback(() => {
    setGb(prev => {
      const next = new GapBufferViz(GAP_BUFFER_SIZE);
      next.buffer = [...prev.buffer];
      next.gapStart = prev.gapStart;
      next.gapEnd = prev.gapEnd;
      next.deleteForward(deleteCount);
      return next;
    });
    addLog('delete', `Forward deleted ${deleteCount} char(s) after cursor`, 'O(n) where n = chars deleted');
  }, [deleteCount, addLog]);

  const handleMoveLeft = useCallback(() => {
    setGb(prev => {
      const next = new GapBufferViz(GAP_BUFFER_SIZE);
      next.buffer = [...prev.buffer];
      next.gapStart = prev.gapStart;
      next.gapEnd = prev.gapEnd;
      next.moveLeft();
      return next;
    });
    addLog('move-left', 'Moved cursor left (gap moved left)', 'O(n) where n = gap distance');
  }, [addLog]);

  const handleMoveRight = useCallback(() => {
    setGb(prev => {
      const next = new GapBufferViz(GAP_BUFFER_SIZE);
      next.buffer = [...prev.buffer];
      next.gapStart = prev.gapStart;
      next.gapEnd = prev.gapEnd;
      next.moveRight();
      return next;
    });
    addLog('move-right', 'Moved cursor right (gap moved right)', 'O(n) where n = gap distance');
  }, [addLog]);

  const handleReset = useCallback(() => {
    setGb(new GapBufferViz(GAP_BUFFER_SIZE));
    setLogs([]);
    setHighlightCells(new Set());
  }, []);

  const cells = gb.getCells();
  const fullText = gb.getText();

  const typeColors: Record<string, string> = {
    'insert': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'delete': 'bg-red-500/20 text-red-400 border-red-500/30',
    'move-left': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'move-right': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-8">
      {/* Visual buffer */}
      <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
          <span className="text-2xl">🔬</span> Gap Buffer Visualization
        </h3>
        <p className="text-text-secondary text-sm mb-5">
          Each cell is a position in the array. Pink cells form the <strong>gap</strong> (cursor position).
          Typing fills the gap from the left.
        </p>

        {/* Buffer cells */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-6">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className={`
                cell relative w-10 h-10 flex items-center justify-center rounded-lg font-mono text-lg font-bold
                ${cell.isGap
                  ? 'bg-gap/20 border-2 border-dashed border-gap gap-pulse'
                  : highlightCells.has(cell.index)
                    ? 'bg-cursor/30 border-2 border-cursor scale-110'
                    : 'bg-editor-light border border-white/10 text-text-primary'
                }
              `}
            >
              {cell.isGap ? (
                <span className="text-gap text-xs font-normal gap-pulse">_</span>
              ) : (
                <span>{cell.char}</span>
              )}
              <span className="absolute -bottom-4 text-[9px] text-text-secondary opacity-50">
                {cell.index}
              </span>
            </div>
          ))}
        </div>

        {/* Gap indicators */}
        <div className="flex justify-center gap-8 mt-6 mb-2 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gap/30 border border-dashed border-gap"></div>
            <span>Gap (cursor here)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-editor-light border border-white/10"></div>
            <span>Character</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cursor/30 border border-cursor"></div>
            <span>Modified</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-editor-dark rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text-primary">{fullText.length}</div>
            <div className="text-xs text-text-secondary">Text Length</div>
          </div>
          <div className="bg-editor-dark rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gap">{gb.gapSize}</div>
            <div className="text-xs text-text-secondary">Gap Size</div>
          </div>
          <div className="bg-editor-dark rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cursor">{gb.gapStart}</div>
            <div className="text-xs text-text-secondary">Gap Start</div>
          </div>
          <div className="bg-editor-dark rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-editor-light">{gb.gapEnd}</div>
            <div className="text-xs text-text-secondary">Gap End</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-2xl">🎮</span> Controls
        </h3>

        <div className="space-y-4">
          {/* Insert */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="Type to insert..."
                className="flex-1 bg-editor-dark text-text-primary px-4 py-2.5 rounded-xl border border-white/10 focus:border-cursor focus:outline-none placeholder:text-text-secondary/50 font-mono"
              />
              <button
                onClick={handleInsert}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Type size={16} /> Insert
              </button>
            </div>
          </div>

          {/* Delete & Navigate */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">Count:</label>
              <input
                type="number"
                value={deleteCount}
                onChange={(e) => setDeleteCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-editor-dark text-text-primary px-3 py-2 rounded-lg border border-white/10 focus:border-cursor focus:outline-none text-center font-mono"
                min={1}
                max={20}
              />
            </div>
            <button
              onClick={handleDelete}
              className="bg-red-600/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <Eraser size={14} /> Delete Back
            </button>
            <button
              onClick={handleDeleteForward}
              className="bg-orange-600/80 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <Eraser size={14} /> Delete Fwd
            </button>
            <button
              onClick={handleMoveLeft}
              className="bg-blue-600/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} /> Cursor ←
            </button>
            <button
              onClick={handleMoveRight}
              className="bg-blue-600/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight size={14} /> Cursor →
            </button>
            <button
              onClick={handleReset}
              className="bg-editor-dark hover:bg-editor-light text-text-secondary px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors border border-white/10 ml-auto"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* Operation Log */}
      {logs.length > 0 && (
        <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-2xl">📋</span> Operation Log
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border slide-in ${typeColors[log.type]}`}
              >
                <span className="font-mono font-bold min-w-[24px]">#{i + 1}</span>
                <ChevronLeft size={12} className="opacity-50" />
                <span className="flex-1">{log.description}</span>
                <span className="text-xs opacity-75 italic hidden sm:inline">{log.complexity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
