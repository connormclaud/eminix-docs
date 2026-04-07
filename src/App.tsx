import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GapBufferPage from './pages/GapBufferPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gap-buffer" element={<GapBufferPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
