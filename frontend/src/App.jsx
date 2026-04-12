import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
