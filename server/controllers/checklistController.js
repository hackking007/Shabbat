import Checklist from '../models/Checklist.js';

// @desc    Get user checklist
// @route   GET /api/checklist
// @access  Private
export const getChecklist = async (req, res) => {
  try {
    const checklist = await Checklist.findOne({ user: req.user._id });

    if (!checklist) {
      return res.status(200).json({ needsSetup: true });
    }

    res.json(checklist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Initialize user checklist
// @route   POST /api/checklist/setup
// @access  Private
export const setupChecklist = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'נא לבחור לפחות משימה אחת' });
    }

    let checklist = await Checklist.findOne({ user: req.user._id });

    if (checklist) {
      checklist.tasks = tasks.map(title => ({ title, isCompleted: false }));
    } else {
      checklist = await Checklist.create({
        user: req.user._id,
        tasks: tasks.map(title => ({ title, isCompleted: false })),
      });
    }

    res.status(201).json(checklist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update checklist task status
// @route   PUT /api/checklist/:taskId
// @access  Private
export const updateChecklistTask = async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const checklist = await Checklist.findOne({ user: req.user._id });

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const task = checklist.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.isCompleted = isCompleted;
    await checklist.save();

    res.json(checklist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
