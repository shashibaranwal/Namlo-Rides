import { useAuth } from '../context/AuthContext';

export default function SimulatorPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-2xl font-bold text-gray-900">Namlo Rides — Simulator</h1>
      <p className="text-gray-500 text-sm">Home page placeholder</p>
      <button
        onClick={logout}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
      >
        Sign out
      </button>
    </div>
  );
}
