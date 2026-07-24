const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");

// Initialize Gemini API (Google) if key present
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize OpenAI client as a reliable fallback when OPENAI_API_KEY is provided
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * @desc    Generate content using Gemini AI
 * @route   POST /api/ai/generate
 * @access  Private
 */
/**
 * @desc    Generate content using Gemini AI with retries and fallback
 * @route   POST /api/ai/generate
 * @access  Private
 */
const generateAIContent = async (req, res) => {
    const { prompt, type } = req.body;

    if (!prompt) {
        return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    if (!genAI) {
        return res.status(500).json({
            success: false,
            message: "Gemini API Key is not configured in the server environment."
        });
    }

    let systemInstruction = "";
    let responseMimeType = "text/plain";

    switch (type) {
        case 'project_ideas':
            systemInstruction = "You are an expert project consultant. Provide creative project ideas. Format each idea with a Name, Core Objective, and Target Audience.";
            break;
        case 'project_plan':
            systemInstruction = `You are a senior agile project manager. Generate a detailed project plan in JSON format.
            Follow this exact structure:
            {
                "summary": "A high-level overview of the project and its goals",
                "milestones": [
                    { "title": "Milestone Title", "date": "Estimated Date/Phase", "description": "Details of the milestone" }
                ],
                "risks": [
                    { "risk": "Description of the risk", "impact": "High|Medium|Low" }
                ],
                "userStories": [
                    { "title": "As a [user], I want to [action] so that [benefit]", "priority": "High|Medium|Low", "points": Number }
                ],
                "riskScore": Number (0-100)
            }
            RESPOND ONLY WITH VALID JSON. DO NOT INCLUDE ANY MARKDOWN WRAPPERS OR EXPLANATORY TEXT.`;
            responseMimeType = "application/json";
            break;
        case 'task_breakdown':
            systemInstruction = "You are a senior project manager. Breakdown the given project into 5-7 actionable, concise steps.";
            break;
        case 'timeline':
            systemInstruction = "You are a project planner. Suggest a realistic, phase-base timeline (e.g., Week 1, Phase 1) for the requested project.";
            break;
        default:
            systemInstruction = "You are a helpful project management assistant.";
    }

    // --- Prefer OpenAI when available (more predictable behavior) ---
    if (openaiClient) {
        try {
            const chatResponse = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 1200
            });

            const text = (chatResponse?.choices && chatResponse.choices[0] && chatResponse.choices[0].message && chatResponse.choices[0].message.content) || '';

            let finalData = text;
            if (responseMimeType === 'application/json') {
                try {
                    let cleanedText = text.replace(/```json|```/g, '').trim();
                    const startIdx = cleanedText.indexOf('{');
                    const endIdx = cleanedText.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) cleanedText = cleanedText.substring(startIdx, endIdx + 1);
                    finalData = JSON.parse(cleanedText);
                } catch (e) {
                    console.error('OpenAI JSON parse failed, returning raw text');
                }
            }

            return res.json({ success: true, data: finalData, provider: 'openai', modelUsed: process.env.OPENAI_MODEL || 'gpt-3.5-turbo' });
        } catch (openaiErr) {
            console.warn('OpenAI call failed, falling back to Google Generative API if configured:', openaiErr.message || openaiErr);
        }
    }

    // --- Fallback to Google Generative AI (Gemini) when OpenAI not configured or failed ---
    const MAX_RETRIES = 2;
    // Keep a short list of commonly-available model names; library will skip unsupported ones
    const MODELS = [
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-1.5-pro'
    ];

    let lastError = null;

    if (!genAI) {
        return res.status(500).json({ success: false, message: 'No AI provider is configured. Set OPENAI_API_KEY or GEMINI_API_KEY.' });
    }

    for (let modelName of MODELS) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                console.log(`AI Attempt ${attempt + 1} using Google model: ${modelName}...`);

                const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });

                const generationConfig = {
                    temperature: 0.1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                    responseMimeType
                };

                const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig });
                const response = result.response;
                const textResult = response.text();
                console.log(`Gemini Success with ${modelName} on attempt ${attempt + 1}.`);

                let finalData = textResult;
                if (responseMimeType === 'application/json') {
                    try {
                        let cleanedText = textResult.replace(/```json|```/g, '').trim();
                        const startIdx = cleanedText.indexOf('{');
                        const endIdx = cleanedText.lastIndexOf('}');
                        if (startIdx !== -1 && endIdx !== -1) cleanedText = cleanedText.substring(startIdx, endIdx + 1);
                        finalData = JSON.parse(cleanedText);
                    } catch (e) {
                        console.error('Google JSON parse failed, returning raw text');
                    }
                }

                return res.json({ success: true, data: finalData, provider: 'google', modelUsed: modelName });
            } catch (error) {
                lastError = error;
                const errorText = (error.message || '').toLowerCase();
                const isRetryable = errorText.includes('503') || errorText.includes('high demand') || errorText.includes('overloaded') || errorText.includes('service unavailable') || errorText.includes('429');
                const isNotFound = errorText.includes('404') || errorText.includes('not found') || errorText.includes('invalid') || errorText.includes('not supported');

                if (isNotFound) {
                    console.warn(`Model ${modelName} NOT AVAILABLE (404/Unsupported). Skipping...`);
                    break;
                }

                if (isRetryable && attempt < MAX_RETRIES - 1) {
                    const delay = (attempt + 1) * 1500;
                    console.warn(`Model ${modelName} BUSY. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                console.warn(`Model ${modelName} failed (Permanent/Exhausted). Switching to next available model.`);
                break;
            }
        }
    }

    console.error('ALL AI MODELS EXHAUSTED OR UNAVAILABLE. Falling back to local generator.');

    // Local fallback generator: produce a reasonable project plan when external AI services are unavailable.
    const generateLocalPlan = (promptText) => {
        const title = (promptText && promptText.split('\n')[0].slice(0, 60)) || 'Project';
        const summary = `Auto-generated plan for: ${title}. Goals: produce a minimal viable plan based on the prompt.`;

        const milestones = [
            { title: 'Discovery & Requirements', date: 'Week 1', description: 'Gather requirements, define MVP scope, and prepare backlog.' },
            { title: 'Implementation (MVP)', date: 'Week 2-4', description: 'Implement core features, basic UI, and API integration.' },
            { title: 'Testing & Launch', date: 'Week 5-6', description: 'QA, bug fixes, deploy MVP, and gather feedback.' }
        ];

        const risks = [
            { risk: 'Unclear requirements', impact: 'High' },
            { risk: 'Integration delays', impact: 'Medium' }
        ];

        const userStories = [
            { title: 'As a user, I want to create tasks so that I can track work', priority: 'High', points: 3 },
            { title: 'As a user, I want to mark tasks complete so that I can track progress', priority: 'High', points: 2 },
            { title: 'As a user, I want to assign due dates so that I can prioritize', priority: 'Medium', points: 2 }
        ];

        const riskScore = 35;

        return { summary, milestones, risks, userStories, riskScore };
    };

    // If requested JSON, return generated local JSON plan, otherwise return a short text fallback
    if (responseMimeType === 'application/json') {
        const localPlan = generateLocalPlan(prompt);
        return res.json({ success: true, data: localPlan, provider: 'local-fallback' });
    }

    // Text fallback
    const fallbackText = `Unable to reach external AI providers. Local fallback plan:\nSummary: A short plan for '${prompt.slice(0,80)}'`;
    return res.json({ success: true, data: fallbackText, provider: 'local-fallback' });
};

/**
 * @desc    Generate AI Insights based on actual project data
 * @route   GET /api/insights
 * @access  Private
 */
const generateInsights = async (req, res) => {
    try {
        const Project = require('../models/Project');
        const Task = require('../models/Task');
        
        // Handle case where auth is disabled (req.user is undefined)
        let projects;
        if (req.user && req.user.id) {
            const userId = req.user.id;
            // Fetch projects for this user
            projects = await Project.find({
                $or: [
                    { owner: userId },
                    { members: userId }
                ]
            });
        } else {
            // If auth is disabled, fetch all projects (dev/testing mode)
            projects = await Project.find();
        }

        if (!projects.length) {
            return res.json({ success: true, insights: [] });
        }

        const projectIds = projects.map(p => p._id);

        // Fetch all tasks in these projects (backlogs & sprints)
        const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignedTo', 'username email');

        // Calculate metrics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => ['Done', 'Completed'].includes(t.status)).length;
        const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['Done', 'Completed'].includes(t.status)).length;
        const unassignedTasks = tasks.filter(t => !t.assignedTo).length;
        const backlogTasks = tasks.filter(t => ['Pending', 'Backlog', 'To Do'].includes(t.status)).length;
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const avgPoints = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + (t.points || 0), 0) / tasks.length) : 0;
        const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0);

        const insights = [];

        // 1. Check for overdue tasks
        if (overdueTasks > 0) {
            insights.push({
                id: 1,
                type: 'Risk',
                title: `${overdueTasks} Overdue Task${overdueTasks > 1 ? 's' : ''}`,
                description: `You have ${overdueTasks} task${overdueTasks > 1 ? 's' : ''} past their due date. Prioritize completing these tasks immediately to avoid further delays and maintain project momentum.`,
                read: false,
                date: 'Just now'
            });
        } else if (totalTasks > 0) {
            insights.push({
                id: 1,
                type: 'Win',
                title: 'No Overdue Tasks',
                description: `Great! All tasks are on track with no overdue items. Keep maintaining this pace to ensure the project stays on schedule.`,
                read: false,
                date: 'Just now'
            });
        }

        // 2. Unassigned tasks warning
        if (unassignedTasks > 0) {
            insights.push({
                id: 2,
                type: 'Warning',
                title: `${unassignedTasks} Unassigned Task${unassignedTasks > 1 ? 's' : ''}`,
                description: `There ${unassignedTasks === 1 ? 'is' : 'are'} ${unassignedTasks} unassigned task${unassignedTasks > 1 ? 's' : ''} in the backlog. Assign these promptly to team members to avoid bottlenecks and keep work moving forward.`,
                read: false,
                date: 'Just now'
            });
        }

        // 3. Backlog analysis
        if (backlogTasks > completedTasks) {
            const ratio = Math.round(backlogTasks / (completedTasks || 1));
            insights.push({
                id: 3,
                type: 'Warning',
                title: `High Backlog Volume (${backlogTasks} pending)`,
                description: `Your backlog contains ${backlogTasks} pending tasks compared to ${completedTasks} completed. Consider prioritizing high-value items and breaking down large tasks to accelerate delivery and maintain team velocity.`,
                read: false,
                date: '2 hours ago'
            });
        } else if (completedTasks > 0 && backlogTasks <= 3) {
            insights.push({
                id: 3,
                type: 'Win',
                title: 'Excellent Backlog Management',
                description: `Your team has completed ${completedTasks} tasks with only ${backlogTasks} remaining. This shows strong execution and prioritization. Maintain this momentum!`,
                read: false,
                date: '2 hours ago'
            });
        }

        // 4. Team capacity insights
        const avgTasksPerMember = totalTasks > 0 ? totalTasks / projects.length : 0;
        if (inProgressTasks < totalTasks * 0.3) {
            insights.push({
                id: 4,
                type: 'Tip',
                title: 'Low Active Work Detected',
                description: `Only ${inProgressTasks} out of ${totalTasks} tasks are currently in progress. This suggests untapped capacity. Review the backlog and pull more tasks into the active sprint to maximize team productivity.`,
                read: false,
                date: '4 hours ago'
            });
        }

        // 5. Completion rate feedback
        if (completionRate >= 75) {
            insights.push({
                id: 5,
                type: 'Win',
                title: `Strong Completion Rate (${completionRate}%)`,
                description: `Your team has achieved a ${completionRate}% completion rate! This demonstrates excellent execution. Keep reinforcing this high-performance culture.`,
                read: false,
                date: '1 day ago'
            });
        } else if (completionRate >= 50) {
            insights.push({
                id: 5,
                type: 'Tip',
                title: `Moderate Progress (${completionRate}%)`,
                description: `Current completion rate is ${completionRate}%. To accelerate delivery, focus on removing blockers, improving task clarity, and ensuring realistic capacity planning.`,
                read: false,
                date: '1 day ago'
            });
        }

        // 6. Sprint health
        const sprints = [...new Set(tasks.filter(t => t.sprint).map(t => t.sprint).filter(Boolean))];
        if (sprints.length > 0) {
            const sprintTasks = tasks.filter(t => t.sprint);
            const sprintCompletionRate = sprintTasks.length > 0 
                ? Math.round((sprintTasks.filter(t => ['Done', 'Completed'].includes(t.status)).length / sprintTasks.length) * 100) 
                : 0;
            
            if (sprintCompletionRate < 50) {
                insights.push({
                    id: 6,
                    type: 'Risk',
                    title: `Sprint Below 50% Complete (${sprintCompletionRate}%)`,
                    description: `Current sprint is only ${sprintCompletionRate}% complete. Investigate blockers, rebalance team workload, and ensure focus on sprint goals.`,
                    read: false,
                    date: '2 days ago'
                });
            }
        }

        // 7. Task complexity insight  
        const highPriorityTasks = tasks.filter(t => t.priority === 'High' || t.priority === 'Critical');
        if (highPriorityTasks.length > 0) {
            const highPriorityDone = highPriorityTasks.filter(t => ['Done', 'Completed'].includes(t.status)).length;
            if (highPriorityDone < highPriorityTasks.length * 0.5) {
                insights.push({
                    id: 7,
                    type: 'Warning',
                    title: `${highPriorityTasks.length - highPriorityDone} High Priority Tasks Pending`,
                    description: `You have ${highPriorityTasks.length - highPriorityDone} high-priority tasks still pending. These should be your team's top focus to ensure critical features are delivered on time.`,
                    read: false,
                    date: '2 days ago'
                });
            }
        }

        return res.json({ success: true, insights });
    } catch (error) {
        console.error('Insights generation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateAIContent,
    generateInsights
};
