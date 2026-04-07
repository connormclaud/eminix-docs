import { Terminal, BookOpen, ArrowRight, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const docs = [
    {
      id: 'gap-buffer',
      title: 'Gap Buffer',
      description: 'The elegant data structure behind modern text editors like Emacs and Sublime Text.',
      icon: <Terminal className="text-cursor" size={24} />,
      link: '/gap-buffer',
      status: 'Ready'
    },
    {
      id: 'more-coming',
      title: 'More coming soon...',
      description: 'New interactive guides on text editor internals and algorithms are currently in development.',
      icon: <BookOpen className="text-text-secondary" size={24} />,
      link: '#',
      status: 'In Progress'
    }
  ];

  return (
    <div className="min-h-screen text-text-primary bg-editor-dark">
      <header className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/5 via-transparent to-transparent"></div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Eminix Docs
            </span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Eminix useful documentation and interactive guides.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div 
              key={doc.id}
              className={`
                group relative bg-editor-mid border border-white/5 rounded-2xl p-6 transition-all
                ${doc.status === 'Ready' ? 'hover:border-cursor/30 hover:bg-cursor/5 cursor-pointer' : 'opacity-60'}
              `}
            >
              {doc.status === 'Ready' ? (
                <Link to={doc.link} className="absolute inset-0 z-10" />
              ) : null}
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-editor-dark rounded-xl border border-white/5 group-hover:border-cursor/20 transition-colors">
                  {doc.icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                  doc.status === 'Ready' ? 'bg-cursor/20 text-cursor' : 'bg-white/5 text-text-secondary'
                }`}>
                  {doc.status}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2 group-hover:text-cursor transition-colors">{doc.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {doc.description}
              </p>

              {doc.status === 'Ready' && (
                <div className="flex items-center gap-2 text-sm font-bold text-cursor">
                  Start Learning
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5 mt-12 text-center text-sm text-text-secondary">
        <p>A collection of interactive editor documentation.</p>
      </footer>
    </div>
  );
}
