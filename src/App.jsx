import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SimulatorPage from './pages/SimulatorPage';
import HistoryView from './components/history/HistoryView';



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<SimulatorPage />} />
              <Route path="/history" element={<HistoryView />} />
            </Route>
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
