const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// GET /api/habits - Get all habits and their logs for the current user
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Also fetch the last 14 days of logs so the UI can show completion status
    const habitIds = habits.map((h) => h._id);
    const logs = await HabitLog.find({
      habit: { $in: habitIds },
      user: req.user._id,
    });

    res.status(200).json({ habits, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/habits - Create a new habit
const createHabit = async (req, res) => {
  try {
    const { name, frequency, targetDays } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      name: name.trim(),
      frequency: frequency || 'daily',
      targetDays: targetDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      user: req.user._id,
    });

    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/habits/:id - Update habit details or archive status
const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.status(200).json(habit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/habits/:id - Delete a habit and all of its associated logs
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Clean up all related logs (cascade delete)
    await HabitLog.deleteMany({ habit: req.params.id });

    res.status(200).json({ message: 'Habit and related logs deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/habits/:id/log - Toggle check-off for a specific date
const toggleHabitLog = async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // Ensure the habit exists and belongs to the user
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const existingLog = await HabitLog.findOne({
      habit: req.params.id,
      date,
      user: req.user._id,
    });

    if (existingLog) {
      await HabitLog.findByIdAndDelete(existingLog._id);
      return res.status(200).json({
        message: 'Habit unmarked for date',
        completed: false,
        date,
        habitId: req.params.id,
      });
    }

    const newLog = await HabitLog.create({
      habit: req.params.id,
      date,
      user: req.user._id,
      completed: true,
    });

    return res.status(201).json({
      message: 'Habit marked complete',
      completed: true,
      log: newLog,
      date,
      habitId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
};
