import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GapBufferPage from './pages/GapBufferPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gap-buffer" element={<GapBufferPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
