import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Planner from './pages/Planner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Planner />} />
                <Route path="/habits" element={<Planner />} />
                <Route path="/dashboard" element={<Planner />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
