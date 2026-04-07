import { useState } from 'react';
import { Terminal, Play, BookOpen, Code2, BarChart3 } from 'lucide-react';
import GapBufferVisualizer from './components/GapBufferVisualizer';
import Concepts from './components/Concepts';
import CodeDisplay from './components/CodeDisplay';
import StepByStep from './components/StepByStep';
import Comparison from './components/Comparison';

type Tab = 'concepts' | 'visualize' | 'walkthrough' | 'code' | 'comparison';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'concepts', label: 'Concepts', icon: <BookOpen size={16} /> },
  { id: 'visualize', label: 'Interactive', icon: <Play size={16} /> },
  { id: 'walkthrough', label: 'Walkthrough', icon: <Terminal size={16} /> },
  { id: 'code', label: 'Python Code', icon: <Code2 size={16} /> },
  { id: 'comparison', label: 'Comparison', icon: <BarChart3 size={16} /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('concepts');

  return (
    <div className="min-h-screen text-text-primary">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/5 via-transparent to-transparent"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-gap/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 right-10 w-40 h-40 bg-cursor/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-editor-mid border border-white/10 rounded-full px-4 py-1.5 text-sm text-text-secondary mb-6">
            <Terminal size={14} className="text-cursor" />
            <span>Data Structures for Text Editors</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Gap Buffer
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            The elegant data structure behind modern text editors. 
            Learn how a simple array with a movable <span className="text-gap font-semibold">gap</span> enables 
            <span className="text-cursor font-semibold"> blazing-fast</span> typing.
          </p>

          {/* Visual buffer illustration */}
          <div className="flex justify-center mt-8 gap-0.5">
            {['H', 'e', 'l', 'l', 'o'].map((c, i) => (
              <div
                key={i}
                className="w-10 h-10 flex items-center justify-center bg-editor-light border border-white/10 rounded-lg font-mono font-bold text-lg text-text-primary"
              >
                {c}
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={`gap-${i}`}
                className="w-10 h-10 flex items-center justify-center bg-gap/15 border-2 border-dashed border-gap/50 rounded-lg font-mono text-xs text-gap gap-pulse"
              >
                _
              </div>
            ))}
            {['W', 'o', 'r', 'l', 'd'].map((c, i) => (
              <div
                key={`after-${i}`}
                className="w-10 h-10 flex items-center justify-center bg-editor-light border border-white/10 rounded-lg font-mono font-bold text-lg text-text-primary"
              >
                {c}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-2">
            buffer: <span className="text-text-primary">"Hello"</span>
            <span className="text-gap"> ██████ gap ██████</span>
            <span className="text-text-primary"> "World"</span>
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sticky top-0 z-10 bg-[#13111c]/90 backdrop-blur-lg border-b border-white/5">
        <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-cursor/15 text-cursor border border-cursor/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'concepts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Core Concepts</h2>
              <p className="text-text-secondary">Understanding the fundamentals of the Gap Buffer</p>
            </div>
            <Concepts />

            {/* How it works diagram */}
            <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">How Insertion Works</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-sm font-bold text-cursor w-16">Before:</div>
                  <div className="flex gap-0.5 flex-1 justify-center">
                    {['H', 'i', '_', '_'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-bold ${c === '_' ? 'bg-gap/20 border border-dashed border-gap text-gap' : 'bg-editor-light border border-white/10 text-text-primary'}`}>
                        {c === '_' ? '' : c}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="text-cursor text-2xl">↓ type "!"</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-sm font-bold text-emerald-400 w-16">After:</div>
                  <div className="flex gap-0.5 flex-1 justify-center">
                    {['H', 'i', '!', '_'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-bold ${c === '_' ? 'bg-gap/20 border border-dashed border-gap text-gap' : 'bg-editor-light border border-white/10 text-text-primary'}`}>
                        {c === '_' ? '' : c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-editor-dark rounded-lg p-3 border-l-2 border-cursor">
                <p className="text-text-secondary text-sm">
                  Notice: We just wrote "!" into the gap. No shifting needed! This is{' '}
                  <span className="text-cursor font-bold font-mono">O(1)</span>.
                </p>
              </div>
            </div>

            {/* How move works */}
            <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">How Cursor Movement Works</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-sm font-bold text-cursor w-16">Before:</div>
                  <div className="flex gap-0.5 flex-1 justify-center">
                    {['H', 'i', '_', '_', '_'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-bold ${c === '_' ? 'bg-gap/20 border border-dashed border-gap text-gap' : 'bg-editor-light border border-white/10 text-text-primary'}`}>
                        {c === '_' ? '' : c}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="text-blue-400 text-2xl">← move cursor left 1</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-sm font-bold text-blue-400 w-16">After:</div>
                  <div className="flex gap-0.5 flex-1 justify-center">
                    {['H', '_', '_', '_', 'i'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-bold ${c === '_' ? 'bg-gap/20 border border-dashed border-gap text-gap' : 'bg-editor-light border border-white/10 text-text-primary'}`}>
                        {c === '_' ? '' : c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-editor-dark rounded-lg p-3 border-l-2 border-blue-400">
                <p className="text-text-secondary text-sm">
                  The "i" shifted from the right of the gap to the left. The gap moved left with it.
                  This costs <span className="text-orange-400 font-bold font-mono">O(n)</span> where n = distance moved.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Interactive Playground</h2>
              <p className="text-text-secondary">Type, delete, and move the cursor to see the gap buffer in action</p>
            </div>
            <GapBufferVisualizer />
          </div>
        )}

        {activeTab === 'walkthrough' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Step-by-Step Walkthrough</h2>
              <p className="text-text-secondary">Follow along as we build a complete editing session</p>
            </div>
            <StepByStep />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Python Implementation</h2>
              <p className="text-text-secondary">A clean, commented Gap Buffer implementation you can study and run</p>
            </div>
            <CodeDisplay />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Performance Comparison</h2>
              <p className="text-text-secondary">How Gap Buffer stacks up against other text buffer implementations</p>
            </div>
            <Comparison />

            <div className="bg-editor-mid rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-text-primary mb-3">When to Use What?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cursor mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-text-primary">Gap Buffer</strong>
                    <span className="text-text-secondary text-sm"> — Best for single-cursor editors with typical typing patterns. Used by Emacs, Sublime Text, and many others.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-text-primary">Piece Table</strong>
                    <span className="text-text-secondary text-sm"> — Best for editors with undo/redo requirements. Used by VS Code and Atom.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-text-primary">Rope</strong>
                    <span className="text-text-secondary text-sm"> — Best for very large documents and multi-cursor editing. Used by some IDEs and code formatters.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-text-primary">Array / String</strong>
                    <span className="text-text-secondary text-sm"> — Simple but O(n) for every insert/delete. Only good for tiny documents or read-only use.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-white/5 mt-8">
        <div className="text-center text-sm text-text-secondary">
          <p>
            Built for students learning how text editors work.{' '}
            <span className="text-cursor font-medium">Gap Buffer</span> — simple, elegant, effective.
          </p>
        </div>
      </footer>
    </div>
  );
}
