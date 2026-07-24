const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Compute affinity score between a task and a member (0-100) */
const computeScore = (task, member, memberLoad) => {
    let score = 50; // base

    // 1. Skill-match bonus (up to +30)
    const taskSkills = (task.skills || task.tags || []).map(s => s.toLowerCase());
    const memberSkills = (member.skills || []).map(s => s.toLowerCase());
    if (taskSkills.length && memberSkills.length) {
        const overlap = taskSkills.filter(s => memberSkills.includes(s)).length;
        score += Math.round((overlap / taskSkills.length) * 30);
    }

    // 2. Role-keyword match (+15)
    const roleKeywords = (member.role || '').toLowerCase().split(/[\s,]+/);
    const titleWords = task.title.toLowerCase().split(/[\s,]+/);
    const roleMatch = roleKeywords.some(k => titleWords.includes(k));
    if (roleMatch) score += 15;

    // 3. Workload penalty — avoid overloaded members (up to -40)
    const loadPenalty = Math.min(40, Math.floor(memberLoad * 2));
    score -= loadPenalty;

    return Math.max(0, Math.min(100, score));
};

/** Build a load map: userId -> current pending story points */
const buildLoadMap = (tasks, membersById) => {
    const loadMap = {};
    for (const id of Object.keys(membersById)) loadMap[id] = 0;

    tasks.forEach(t => {
        if (t.assignedTo && t.status !== 'Done' && t.status !== 'Completed') {
            const uid = t.assignedTo.toString();
            if (uid in loadMap) loadMap[uid] = (loadMap[uid] || 0) + (t.points || 3);
        }
    });
    return loadMap;
};

// ─────────────────────────────────────────────
//  GET WORKLOAD SUMMARY  (GET /api/workload)
// ─────────────────────────────────────────────
const getWorkload = async (req, res) => {
    try {
        // Fetch all projects owned by or containing this user
        const projects = await Project.find({
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        });

        const projectIds = projects.map(p => p._id);

        // All tasks in those projects
        const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignedTo', 'username email');

        // Collect distinct users from task.assignedTo + project.members + project.teamConfig emails
        const userSet = new Map();
        tasks.forEach(t => {
            if (t.assignedTo) {
                const u = t.assignedTo;
                userSet.set(u._id.toString(), { _id: u._id, username: u.username, email: u.email });
            }
        });

        // Add Unassigned bucket
        const unassignedTasks = tasks.filter(t => !t.assignedTo);

        // Build member stats
        const PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6', '#F97316', '#A855F7'];
        const members = Array.from(userSet.values()).map((u, i) => {
            const memberTasks = tasks.filter(t => t.assignedTo && t.assignedTo._id.toString() === u._id.toString());
            const done = memberTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
            const inProgress = memberTasks.filter(t => t.status === 'In Progress').length;
            const todo = memberTasks.filter(t => !['Done', 'Completed', 'In Progress'].includes(t.status)).length;
            const points = memberTasks.reduce((s, t) => s + (t.points || 3), 0);
            const completion = memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0;
            const avg = userSet.size > 0 ? tasks.reduce((s, t) => s + (t.points || 3), 0) / userSet.size : 0;

            return {
                id: u._id,
                name: u.username || u.email,
                avatar: (u.username || u.email).slice(0, 2).toUpperCase(),
                tasks: memberTasks.length,
                points,
                completion,
                done,
                inProgress,
                todo,
                status: points > avg * 1.5 ? 'Overloaded' : 'OK',
                color: PALETTE[i % PALETTE.length]
            };
        });

        // Unassigned row
        if (unassignedTasks.length > 0) {
            const unPoints = unassignedTasks.reduce((s, t) => s + (t.points || 3), 0);
            members.push({
                id: 'unassigned',
                name: 'Unassigned',
                avatar: '?',
                tasks: unassignedTasks.length,
                points: unPoints,
                completion: 0,
                done: 0,
                inProgress: 0,
                todo: unassignedTasks.length,
                status: 'Unassigned',
                color: '#94A3B8'
            });
        }

        const totalPoints = members.filter(m => m.id !== 'unassigned').reduce((s, m) => s + m.points, 0);
        const realMembers = members.filter(m => m.id !== 'unassigned').length;

        res.json({
            members,
            stats: {
                totalMembers: realMembers,
                totalPoints,
                avgPoints: realMembers > 0 ? Math.round(totalPoints / realMembers) : 0
            },
            projectCount: projects.length,
            taskCount: tasks.length
        });
    } catch (error) {
        console.error('Workload fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
//  SMART REBALANCE  (POST /api/workload/rebalance)
// ─────────────────────────────────────────────
const rebalanceWorkload = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        });
        const projectIds = projects.map(p => p._id);

        // All tasks including unassigned
        const tasks = await Task.find({ project: { $in: projectIds } }).sort({ priority: -1, points: -1 });

        // Collect all known members from teamConfig across projects
        const emailToMember = {};
        projects.forEach(p => {
            (p.teamConfig || []).forEach(m => {
                emailToMember[m.email] = m;
            });
        });

        // Fetch User records for those emails
        const emails = Object.keys(emailToMember);
        const users = await User.find({ email: { $in: emails } });
        const membersById = {};
        users.forEach(u => {
            const cfg = emailToMember[u.email] || {};
            membersById[u._id.toString()] = {
                _id: u._id,
                email: u.email,
                username: u.username,
                role: cfg.role || '',
                skills: cfg.skills || []
            };
        });

        // Fall back: include any user already assigned to tasks (even if not in teamConfig)
        tasks.forEach(t => {
            if (t.assignedTo) {
                const id = t.assignedTo.toString();
                if (!membersById[id]) {
                    membersById[id] = { _id: t.assignedTo, role: '', skills: [] };
                }
            }
        });

        const memberIds = Object.keys(membersById);
        if (memberIds.length === 0) {
            return res.status(400).json({ message: 'No team members found to assign tasks to.' });
        }

        // Build current load map
        const loadMap = buildLoadMap(tasks, membersById);

        // Identify tasks to redistribute:
        //  a) Unassigned tasks
        //  b) Tasks from overloaded members that can be moved
        const totalLoad = memberIds.reduce((s, id) => s + loadMap[id], 0);
        const avgLoad = totalLoad / memberIds.length;
        const threshold = avgLoad * 1.4; // 40% above average = overloaded

        const tasksToReassign = [];
        tasks.forEach(t => {
            const uid = t.assignedTo ? t.assignedTo.toString() : null;
            if (!uid) {
                tasksToReassign.push(t); // unassigned
            } else if (loadMap[uid] > threshold && !['Done', 'Completed'].includes(t.status)) {
                // candidate from overloaded member — only take one at a time from them
                tasksToReassign.push(t);
            }
        });

        // Keep track of how many we've taken from each overloaded member (max 2 per run)
        const takenFromMember = {};
        const filtered = tasksToReassign.filter(t => {
            const uid = t.assignedTo ? t.assignedTo.toString() : null;
            if (!uid) return true;
            takenFromMember[uid] = (takenFromMember[uid] || 0) + 1;
            return takenFromMember[uid] <= 2;
        });

        const reassignments = [];

        for (const task of filtered) {
            // Score every available member
            let bestId = null, bestScore = -1;

            for (const id of memberIds) {
                // Don't re-assign to same overloaded person
                const currentUid = task.assignedTo ? task.assignedTo.toString() : null;
                if (currentUid && id === currentUid && loadMap[id] > threshold) continue;

                const member = membersById[id];
                const score = computeScore(task, member, loadMap[id]);
                if (score > bestScore) {
                    bestScore = score;
                    bestId = id;
                }
            }

            if (bestId) {
                await Task.findByIdAndUpdate(task._id, { assignedTo: membersById[bestId]._id });
                loadMap[bestId] = (loadMap[bestId] || 0) + (task.points || 3);

                // Reduce load from previous owner
                if (task.assignedTo) {
                    const oldId = task.assignedTo.toString();
                    loadMap[oldId] = Math.max(0, (loadMap[oldId] || 0) - (task.points || 3));
                }

                reassignments.push({
                    taskId: task._id,
                    taskTitle: task.title,
                    newAssignee: membersById[bestId].username || membersById[bestId].email,
                    score: bestScore
                });
            }
        }

        // Create notification
        const Notification = require('../models/Notification');
        await Notification.create({
            user: req.user.id,
            title: 'Workload Rebalanced',
            message: `${reassignments.length} task(s) were intelligently reassigned based on skills, roles, and workload.`,
            type: 'success'
        });

        res.json({
            success: true,
            message: `Rebalancing complete. ${reassignments.length} tasks reassigned.`,
            reassignments
        });
    } catch (error) {
        console.error('Rebalance error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getWorkload, rebalanceWorkload };
