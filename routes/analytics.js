const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

/**
 * @desc    Get aggregate statistics
 * @route   GET /api/analytics/stats
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        // Projects owned by user
        const ownedProjects = await Project.find({ owner: userId });
        const ownedProjectIds = ownedProjects.map(p => p._id);

        // Tasks related to user (Either assigned to them or in their owned projects)
        const tasks = await Task.find({
            $or: [
                { assignedTo: userId },
                { project: { $in: ownedProjectIds } }
            ]
        });

        // Calculate story points
        const storyPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
        const completedStoryPoints = tasks
            .filter(t => t.status === 'Completed' || t.status === 'Done')
            .reduce((sum, t) => sum + (t.points || 0), 0);

        // Calculate active sprints (unique sprint names)
        const uniqueSprints = [...new Set(tasks.map(t => t.sprint).filter(Boolean))];

        const stats = {
            totalProjects: ownedProjects.length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => ['Completed', 'Done'].includes(t.status)).length,
            inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
            pendingTasks: tasks.filter(t => ['Pending', 'Backlog', 'To Do'].includes(t.status)).length,
            completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => ['Completed', 'Done'].includes(t.status)).length / tasks.length) * 100) : 0,
            storyPoints: completedStoryPoints,
            totalStoryPoints: storyPoints,
            activeSprints: uniqueSprints.length
        };

        // For the chart: tasks created per day in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await Task.aggregate([
            {
                $match: {
                    $or: [
                        { assignedTo: req.user._id },
                        { project: { $in: ownedProjectIds } }
                    ],
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $in: ["$status", ["Completed", "Done"]] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ stats, dailyStats });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server Error fetching analytics' });
    }
});

module.exports = router;
