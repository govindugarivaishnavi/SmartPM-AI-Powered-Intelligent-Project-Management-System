const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateAIContent, generateInsights } = require('../controllers/aiController');

// Allow disabling auth for AI route in development for quick local testing.
// Set DISABLE_AUTH_FOR_AI=true in server/.env to bypass the `protect` middleware.
const disableAuthForAI = process.env.DISABLE_AUTH_FOR_AI === 'true';

/**
 * @desc    Generate AI Project content
 * @route   POST /api/ai/generate
 * @access  Private
 */
if (disableAuthForAI) {
	console.warn('Warning: AI auth is disabled (DISABLE_AUTH_FOR_AI=true). This should only be used in development.');
	router.post('/generate', generateAIContent);
	router.get('/insights', generateInsights);
} else {
	router.post('/generate', protect, generateAIContent);
	router.get('/insights', protect, generateInsights);
}

module.exports = router;

