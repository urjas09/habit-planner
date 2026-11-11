import { useAuth } from '../context/AuthContext';

const Planner = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="page-subtitle">Your personal daily planner dashboard.</p>
      </div>

      <div className="card">
        <h3>Authentication Setup Complete</h3>
        <p>
          You are securely logged in as <strong>{user?.email}</strong>.
        </p>
        <p>
          In Step 5, we will build the task creation forms, daily task list, and filters right here.
        </p>
      </div>
    </div>
  );
};

export default Planner;
