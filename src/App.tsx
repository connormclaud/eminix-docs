import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GapBufferPage from './pages/GapBufferPage';
import ParetoPruningPage from './pages/ParetoPruningPage';
import BranchAndBoundPage from './pages/BranchAndBoundPage';
import CharmKnapsackPage from './pages/CharmKnapsackPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gap-buffer" element={<GapBufferPage />} />
        <Route path="/pareto-pruning" element={<ParetoPruningPage />} />
        <Route path="/branch-and-bound" element={<BranchAndBoundPage />} />
        <Route path="/charm-knapsack" element={<CharmKnapsackPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
