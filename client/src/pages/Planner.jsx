import { useState, useEffect } from 'react';
import api from '../api/axios';

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Planner = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected date for daily planning
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Filter: 'all' | 'pending' | 'completed'
  const [filter, setFilter] = useState('all');

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Work');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all tasks for the logged in user
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Date navigation helpers
  const handleDateChange = (daysOffset) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + daysOffset);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        startTime,
        priority,
        category,
      });

      setTasks((prev) => [...prev, res.data]);
      setTitle('');
      setDescription('');
      setStartTime('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle complete
  const handleToggleComplete = async (id, currentCompleted) => {
    try {
      const res = await api.put(`/tasks/${id}`, {
        completed: !currentCompleted,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? res.data : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Filter tasks for the selected date and status
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const visibleTasks = dayTasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = dayTasks.filter((t) => t.completed).length;

  return (
    <div className="planner-page">
      {/* Date Bar */}
      <section className="date-bar">
        <div className="date-controls">
          <button
            type="button"
            className="btn-icon"
            onClick={() => handleDateChange(-1)}
            aria-label="Previous day"
          >
            &larr;
          </button>
          <input
            type="date"
            className="date-picker-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            type="button"
            className="btn-icon"
            onClick={() => handleDateChange(1)}
            aria-label="Next day"
          >
            &rarr;
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSelectedDate(getTodayString())}
          >
            Today
          </button>
        </div>

        <div className="day-summary">
          <span>
            {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'} scheduled
          </span>
          <span className="summary-dot">&bull;</span>
          <span>{completedCount} completed</span>
        </div>
      </section>

      {/* Main Grid: Form on one side / top, Tasks List on the other */}
      <div className="planner-layout">
        {/* Task Form */}
        <section className="planner-card task-form-card">
          <h3>Add Task</h3>
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-group">
              <label htmlFor="task-title">Task Title</label>
              <input
                id="task-title"
                type="text"
                required
                placeholder="What do you need to do?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-time">Time</label>
                <input
                  id="task-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-category">Category</label>
                <select
                  id="task-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Fitness">Fitness</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="task-desc">Description (optional)</label>
              <textarea
                id="task-desc"
                rows="2"
                placeholder="Add additional notes or details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-primary"
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </section>

        {/* Task List */}
        <section className="planner-card task-list-card">
          <div className="list-header">
            <h3>Tasks for {selectedDate}</h3>
            <div className="filter-group">
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({dayTasks.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending ({dayTasks.length - completedCount})
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Done ({completedCount})
              </button>
            </div>
          </div>

          {loading ? (
            <p className="status-text">Loading tasks...</p>
          ) : error ? (
            <p className="error-banner">{error}</p>
          ) : visibleTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks found for this view.</p>
              <span className="empty-hint">Use the form to plan your day.</span>
            </div>
          ) : (
            <ul className="task-items">
              {visibleTasks.map((t) => (
                <li key={t._id} className={`task-item ${t.completed ? 'is-completed' : ''}`}>
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => handleToggleComplete(t._id, t.completed)}
                      aria-label={`Mark ${t.title} complete`}
                    />
                    <span className="checkbox-custom"></span>
                  </label>

                  <div className="task-content">
                    <div className="task-title-row">
                      <span className="task-title">{t.title}</span>
                      {t.startTime && <span className="task-time">{t.startTime}</span>}
                    </div>

                    {t.description && (
                      <p className="task-description">{t.description}</p>
                    )}

                    <div className="task-meta">
                      <span className={`badge badge-priority badge-${t.priority}`}>
                        {t.priority}
                      </span>
                      <span className="badge badge-category">{t.category}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDeleteTask(t._id)}
                    aria-label={`Delete task ${t.title}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Planner;
