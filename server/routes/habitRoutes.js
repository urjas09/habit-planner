const express = require('express');
const router = express.Router();
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
} = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

// All habit routes require authentication
router.use(protect);

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .put(updateHabit)
  .delete(deleteHabit);

router.route('/:id/log')
  .post(toggleHabitLog);

module.exports = router;
