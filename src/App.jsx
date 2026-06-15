import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SimulatorPage from './pages/SimulatorPage';



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<SimulatorPage />} />
              {/* <Route path="/history" element={<HistoryView />} /> */}
            </Route>
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
