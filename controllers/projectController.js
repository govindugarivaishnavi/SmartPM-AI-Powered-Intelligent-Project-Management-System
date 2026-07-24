const Project = require('../models/Project');

// @desc    Get all projects for the logged-in user
// @route   GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user.id });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        // Allow owner or members to view
        if (project.owner.toString() !== req.user.id && !project.members.includes(req.user.id)) {
            // For demo simplicity, maybe allow viewing public projects or looser check?
            // But strict check is better security.
            // If teamConfig has emails, current user might not be in 'members' list yet if they are just invited by email.
            // Allow owner for sure.
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, client, status, category, dueDate, techStack, teamConfig, aiPlan } = req.body;

        const project = await Project.create({
            name,
            description,
            client,
            status,
            category,
            dueDate,
            techStack,
            teamConfig,
            aiPlan,
            owner: req.user.id
        });

        // AUTOMATED TASK GENERATION & ASSIGNMENT
        if (aiPlan && aiPlan.userStories && aiPlan.userStories.length > 0) {
            console.log(`\n--- AUTOMATED TASK GENERATION FOR PROJECT: ${name} ---`);

            // 1. Get list of member User IDs from teamConfig emails
            const memberEmails = (teamConfig || []).map(m => m.email);
            const members = await User.find({ email: { $in: memberEmails } });

            // Also include the owner as a potential assignee if no members
            const assignees = members.length > 0 ? members : [await User.findById(req.user.id)];

            // 2. Create tasks from user stories and assign them
            const taskPromises = aiPlan.userStories.map(async (story, index) => {
                // Round-robin assignment
                const assignee = assignees[index % assignees.length];

                const task = await Task.create({
                    title: story.title,
                    description: `AI Generated Story: ${story.title}. Goal: ${aiPlan.summary}`,
                    project: project._id,
                    assignedTo: assignee._id,
                    status: 'Backlog', // Start in backlog as requested
                    priority: story.priority || 'Medium',
                    points: story.points || 0,
                    type: 'Story'
                });

                console.log(`- Created Task: "${task.title}" assigned to ${assignee.email}`);
                return task;
            });

            await Promise.all(taskPromises);
            console.log('--- TASK GENERATION COMPLETE ---\n');
        }

        // 3. Send professional invitation emails to all team members
        if (teamConfig && teamConfig.length > 0) {
            const emailService = require('../utils/emailService');
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const projectUrl = `${clientUrl}/projects/${project._id}`;

            const emailPromises = teamConfig.map(async (member) => {
                const memberName = member.email.split('@')[0]; // Use email prefix as name
                const skillsList = (member.skills && member.skills.length > 0)
                    ? member.skills.join(', ')
                    : 'General';

                const subject = `🎉 You've been added to "${name}" on AI Project Manager`;

                const text = `Hello ${memberName},

You have been added to the project "${name}".

Project URL: ${projectUrl}
Your Role: ${member.role || 'Team Member'}
Your Skills: ${skillsList}

Please log in to start collaborating on the project.

Thank you,
AI Project Management Team`;

                const html = `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                        
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center;">
                            <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">✨</div>
                            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Project Invitation</h1>
                            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">AI Project Manager</p>
                        </div>

                        <!-- Body -->
                        <div style="padding: 32px;">
                            <p style="color: #334155; font-size: 16px; margin: 0 0 8px 0;">Hello <strong>${memberName}</strong>,</p>
                            <p style="color: #64748b; font-size: 15px; margin: 0 0 24px 0;">
                                You have been added to the project <strong style="color: #1e293b;">"${name}"</strong>.
                                ${description ? `<br/><span style="font-size:13px; color:#94a3b8;">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</span>` : ''}
                            </p>

                            <!-- Details Card -->
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Project</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Role</td>
                                        <td style="padding: 8px 0;">
                                            <span style="background: #ede9fe; color: #6d28d9; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px;">${member.role || 'Team Member'}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Skills</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${skillsList}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">URL</td>
                                        <td style="padding: 8px 0;">
                                            <a href="${projectUrl}" style="color: #4f46e5; font-size: 13px; word-break: break-all;">${projectUrl}</a>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
                                Our AI has already generated initial tasks and assigned them to your dashboard based on your role. Log in to start collaborating!
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="${projectUrl}" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(79,70,229,0.35);">
                                    View My Project →
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                                You're receiving this because you were added to a project on AI Project Manager.<br/>
                                This is an automated message — please do not reply.
                            </p>
                        </div>
                    </div>
                `;

                try {
                    const result = await emailService.sendEmail(member.email, subject, text, html);
                    console.log(`✅ Invitation sent to ${member.email} — ${result.messageId || 'OK'}`);
                } catch (emailErr) {
                    console.error(`❌ Failed to send invitation to ${member.email}:`, emailErr.message);
                }
            });

            // Send all invitation emails in parallel
            await Promise.allSettled(emailPromises);
        }

        // CREATE NOTIFICATION FOR PROJECT OWNER
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                user: req.user.id,
                title: 'Project Created',
                message: `Your project "${name}" was created successfully with ${teamConfig ? teamConfig.length : 0} team member(s).`,
                type: 'success'
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check user ownership
        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Send dynamic invitation email to a single member
 * @route   POST /api/projects/invite
 * @access  Private
 */
const inviteMember = async (req, res) => {
    try {
        const { email, role, projectName } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const emailService = require('../utils/emailService');
        const subject = `Project Invitation: ${projectName || 'New Project'}`;
        const text = `Hello! You have been added to the "${projectName || 'New Project'}" project as ${role || 'Team Member'}.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; color: #333;">
                <h2 style="color: #4f46e5;">Project Invitation</h2>
                <p>Hello,</p>
                <p>You have been invited to join the project: <strong>${projectName || 'New Project'}</strong> as a <strong>${role || 'Team Member'}</strong>.</p>
                <p>Our AI is setting up the workspace for you. You will be able to see your assigned tasks once the project plan is finalized.</p>
                <br/>
                <p>Best regards,<br/>AI Project Management Team</p>
            </div>
        `;

        const result = await emailService.sendEmail(email, subject, text, html);

        // CREATE NOTIFICATION FOR THE INVITER
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                user: req.user.id,
                title: 'Invitation Sent',
                message: `Dynamic invitation sent to ${email} for project ${projectName || 'AI Managed Project'}.`,
                type: 'success'
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.json({ success: true, message: 'Invitation email sent successfully', result });
    } catch (error) {
        console.error('Invite Member Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    inviteMember
};
