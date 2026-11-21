import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GapBufferPage from './pages/GapBufferPage';
import ParetoPruningPage from './pages/ParetoPruningPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gap-buffer" element={<GapBufferPage />} />
        <Route path="/pareto-pruning" element={<ParetoPruningPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
