import { useState, useEffect } from 'react';
import api from '../api/axios';

// Helper to get past N days formatted as YYYY-MM-DD and short day name
const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 0;
    days.push({ dateStr, dayName, isToday });
  }
  return days;
};

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New habit form state
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [targetDays, setTargetDays] = useState(ALL_DAYS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const past7Days = getLast7Days();

  const fetchHabitsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habits');
      setHabits(res.data.habits || []);
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsData();
  }, []);

  // Handle Target Day Toggle in Create Form
  const toggleTargetDay = (day) => {
    if (targetDays.includes(day)) {
      if (targetDays.length === 1) return; // keep at least 1 day
      setTargetDays(targetDays.filter((d) => d !== day));
    } else {
      setTargetDays([...targetDays, day]);
    }
  };

  // Create Habit
  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/habits', {
        name: name.trim(),
        frequency,
        targetDays,
      });
      setHabits((prev) => [res.data, ...prev]);
      setName('');
      setTargetDays(ALL_DAYS);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Habit Check-off for a specific date
  const handleToggleLog = async (habitId, dateStr) => {
    try {
      const res = await api.post(`/habits/${habitId}/log`, { date: dateStr });
      if (res.data.completed) {
        // Add new log to state
        setLogs((prev) => [...prev, res.data.log]);
      } else {
        // Remove log from state
        setLogs((prev) =>
          prev.filter(
            (log) => !(log.habit === habitId && log.date === dateStr)
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle habit log:', err);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (habit) => {
    try {
      const res = await api.put(`/habits/${habit._id}`, {
        archived: !habit.archived,
      });
      setHabits((prev) =>
        prev.map((h) => (h._id === habit._id ? res.data : h))
      );
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (id) => {
    if (!window.confirm('Delete this habit and all its logged history?')) return;
    try {
      await api.delete(`/habits/${id}`);
      setHabits((prev) => prev.filter((h) => h._id !== id));
      setLogs((prev) => prev.filter((log) => log.habit !== id));
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const isCompletedOnDate = (habitId, dateStr) => {
    return logs.some(
      (log) => log.habit === habitId && log.date === dateStr && log.completed
    );
  };

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  return (
    <div className="habits-page">
      <div className="page-header">
        <h1>Habit Tracker</h1>
        <p className="page-subtitle">Build consistent routines with daily check-offs.</p>
      </div>

      <div className="planner-layout">
        {/* Create Habit Form */}
        <section className="planner-card">
          <h3>Create New Habit</h3>
          <form onSubmit={handleCreateHabit} className="task-form">
            <div className="form-group">
              <label htmlFor="habit-name">Habit Name</label>
              <input
                id="habit-name"
                type="text"
                required
                placeholder="e.g. Read 20 mins, Workout, Meditate"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="habit-freq">Frequency</label>
              <select
                id="habit-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target Days</label>
              <div className="days-picker">
                {ALL_DAYS.map((day) => {
                  const isSelected = targetDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      className={`day-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleTargetDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Add Habit'}
            </button>
          </form>
        </section>

        {/* Habits List with 7-day strip */}
        <section className="planner-card">
          <div className="list-header">
            <h3>Active Habits ({activeHabits.length})</h3>
          </div>

          {loading ? (
            <p className="status-text">Loading habits...</p>
          ) : error ? (
            <p className="error-banner">{error}</p>
          ) : activeHabits.length === 0 ? (
            <div className="empty-state">
              <p>No active habits yet.</p>
              <span className="empty-hint">Create your first habit using the form.</span>
            </div>
          ) : (
            <div className="habits-list">
              {activeHabits.map((habit) => (
                <div key={habit._id} className="habit-card">
                  <div className="habit-top-row">
                    <div>
                      <h4 className="habit-name">{habit.name}</h4>
                      <div className="habit-meta-tags">
                        <span className="badge badge-category">{habit.frequency}</span>
                        <span className="habit-days-text">
                          {habit.targetDays.length === 7 ? 'Every day' : habit.targetDays.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="habit-actions">
                      <button
                        type="button"
                        className="btn-text-action"
                        onClick={() => handleToggleArchive(habit)}
                        title="Archive this habit"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        className="btn-text-action btn-text-danger"
                        onClick={() => handleDeleteHabit(habit._id)}
                        title="Delete habit"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Check-off Strip */}
                  <div className="week-strip-container">
                    <p className="strip-label">Last 7 Days:</p>
                    <div className="week-strip">
                      {past7Days.map(({ dateStr, dayName, isToday }) => {
                        const completed = isCompletedOnDate(habit._id, dateStr);
                        return (
                          <div key={dateStr} className={`strip-day-col ${isToday ? 'is-today' : ''}`}>
                            <span className="strip-day-name">{dayName}</span>
                            <span className="strip-date-number">{dateStr.slice(8)}</span>
                            <button
                              type="button"
                              className={`habit-check-circle ${completed ? 'checked' : ''}`}
                              onClick={() => handleToggleLog(habit._id, dateStr)}
                              aria-label={`Toggle ${habit.name} on ${dateStr}`}
                            >
                              {completed ? '✓' : ''}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archived section if any exist */}
          {archivedHabits.length > 0 && (
            <div className="archived-section">
              <h4>Archived Habits ({archivedHabits.length})</h4>
              <div className="archived-list">
                {archivedHabits.map((h) => (
                  <div key={h._id} className="archived-item">
                    <span>{h.name}</span>
                    <button
                      type="button"
                      className="btn-text-action"
                      onClick={() => handleToggleArchive(h)}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Habits;
