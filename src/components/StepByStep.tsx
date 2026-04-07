import { useState } from 'react';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { walkthroughSteps as steps } from '@/data/walkthroughSteps';

export default function StepByStep() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const cells = step.snapshot.buffer.map((char, index) => ({
    char,
    isGap: index >= step.snapshot.gapStart && index < step.snapshot.gapEnd,
    index,
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
        <div className="overflow-x-auto pb-2">
          <div className="flex w-max gap-1.5 mx-auto mb-4 px-1">
            {cells.map((cell) => (
              <div
                key={cell.index}
                className={`
                  relative w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-500
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
                <span className="absolute -bottom-4 text-[9px] text-text-secondary opacity-50">
                  {cell.index}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-editor-mid rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-text-primary">{step.snapshot.text || '""'}</div>
            <div className="text-xs text-text-secondary">Text</div>
          </div>
          <div className="bg-editor-mid rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cursor">{step.snapshot.gapStart}</div>
            <div className="text-xs text-text-secondary">Cursor</div>
          </div>
          <div className="bg-editor-mid rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gap">{step.snapshot.gapSize}</div>
            <div className="text-xs text-text-secondary">Gap Size</div>
          </div>
          <div className="bg-editor-mid rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-text-primary">{step.snapshot.capacity}</div>
            <div className="text-xs text-text-secondary">Capacity</div>
          </div>
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
