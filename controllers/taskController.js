const Task = require('../models/Task');

// @route   GET /api/tasks (all tasks for user's projects)
const getAllTasks = async (req, res) => {
    try {
        // Find projects owned by the user
        const Project = require('../models/Project'); // Import Project model
        const ownedProjects = await Project.find({ owner: req.user.id }).select('_id');
        const ownedProjectIds = ownedProjects.map(p => p._id);

        // Fetch tasks where:
        // 1. User is assigned to the task
        // OR 2. Task belongs to a project the user owns
        const tasks = await Task.find({
            $or: [
                { assignedTo: req.user.id },
                { project: { $in: ownedProjectIds } }
            ]
        }).populate('project assignedTo');

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/tasks/:projectId
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { title, description, projectId, priority, dueDate, status, points, sprint, tags, skills, type, assignedTo } = req.body;

        let assigneeId = req.user.id;
        if (assignedTo) {
            const User = require('../models/User');
            const foundUser = await User.findOne({ email: assignedTo });
            if (foundUser) {
                assigneeId = foundUser._id;
            }
        }

        const task = await Task.create({
            title,
            description,
            project: projectId,
            priority,
            dueDate,
            status: status || 'To Do',
            points,
            sprint,
            tags,
            skills,
            type,
            assignedTo: assigneeId
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllTasks,
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
