import { useState } from 'react';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  buffer: (string | null)[];
  gapStart: number;
  gapEnd: number;
  label: string;
};

const steps: Step[] = [
  {
    title: 'Step 1: Empty Buffer',
    description: 'We start with an empty buffer of capacity 12. The gap spans the entire array. Gap starts at 0 and ends at 12. The cursor is at position 0.',
    buffer: new Array(12).fill(null),
    gapStart: 0,
    gapEnd: 12,
    label: 'New GapBuffer(12)',
  },
  {
    title: 'Step 2: Type "Hello"',
    description: 'We type "Hello". Each character fills the gap from the left side. The gap shrinks by 5. Cursor is now at position 5.',
    buffer: ['H', 'e', 'l', 'l', 'o', null, null, null, null, null, null, null],
    gapStart: 5,
    gapEnd: 12,
    label: 'insert("Hello")',
  },
  {
    title: 'Step 3: Type " World"',
    description: 'We continue typing " World". The gap shrinks by 6 more. Cursor is now at position 11. Only 1 gap cell remains!',
    buffer: ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', null],
    gapStart: 11,
    gapEnd: 12,
    label: 'insert(" World")',
  },
  {
    title: 'Step 4: Move Cursor Left 5',
    description: 'We move the cursor left 5 positions (before "World"). The gap moves left — characters "W", "o", "r", "l", "d" shift right. This is O(n) where n=5.',
    buffer: ['H', 'e', 'l', 'l', 'o', null, null, null, null, null, ' ', 'W', 'o', 'r', 'l', 'd'].slice(0, 12),
    gapStart: 5,
    gapEnd: 11,
    label: 'left() × 5',
  },
  {
    title: 'Step 5: Type "Beautiful "',
    description: 'We type "Beautiful " at the cursor. The gap fills up again! We now have "Hello Beautiful World". This was O(1) per character — the gap was right where we needed it!',
    buffer: ['H', 'e', 'l', 'l', 'o', ' ', 'B', 'e', 'a', 'u', 't', 'i'],
    gapStart: 12,
    gapEnd: 12,
    label: 'insert("Beautiful ")',
  },
  {
    title: 'Step 6: Delete Back 8',
    description: 'We press backspace 8 times (deleting "Beautiful"). The gap expands to the left — no shifting needed! This is O(1) per deletion. Text is now "Hello World" again.',
    buffer: ['H', 'e', 'l', 'l', 'o', null, null, null, null, null, null, null, null, null, null, null],
    gapStart: 5,
    gapEnd: 12,
    label: 'delete(8)',
  },
];

export default function StepByStep() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const cells = step.buffer.map((val, i) => ({
    char: val,
    isGap: i >= step.gapStart && i < step.gapEnd,
  }));

  return (
    <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
        <span className="text-2xl">🎬</span> Step-by-Step Walkthrough
      </h3>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all ${
              i === currentStep
                ? 'bg-cursor text-editor-dark scale-110'
                : i < currentStep
                  ? 'bg-cursor/30 text-cursor border border-cursor/50'
                  : 'bg-editor-dark text-text-secondary border border-white/10'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current step visualization */}
      <div className="bg-editor-dark rounded-xl p-5 mb-4 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Play size={14} className="text-cursor" />
          <code className="text-cursor font-mono text-sm font-bold">{step.label}</code>
        </div>

        <h4 className="text-text-primary font-semibold mb-3">{step.title}</h4>

        {/* Buffer cells */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {cells.map((cell, i) => (
            <div
              key={i}
              className={`
                w-9 h-9 flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-500
                ${cell.isGap
                  ? 'bg-gap/20 border-2 border-dashed border-gap'
                  : 'bg-editor-light border border-white/10 text-text-primary'
                }
              `}
            >
              {cell.isGap ? (
                <span className="text-gap text-xs gap-pulse">_</span>
              ) : (
                <span>{cell.char}</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed bg-editor-dark text-text-secondary hover:bg-editor-light"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-sm text-text-secondary">
          Step {currentStep + 1} of {steps.length}
        </span>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors bg-cursor/20 text-cursor border border-cursor/30 hover:bg-cursor/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
