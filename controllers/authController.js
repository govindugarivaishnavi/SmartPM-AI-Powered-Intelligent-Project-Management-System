const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Shorter access token
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      isEmailVerified: true, // Temporarily set to true for testing
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ================= VERIFY EMAIL =================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    console.log('Finding user for email:', email);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user._id, user.email);

    // // Check if account is locked
    // if (user.isAccountLocked()) {
    //   console.log('Account locked for user:', user._id);
    //   return res.status(423).json({
    //     message: 'Account is temporarily locked due to too many failed login attempts'
    //   });
    // }

    // Debug: log user and password
    console.log('User found for login:', user.email, 'Hashed password:', user.password);

    let isMatch;
    try {
      console.log('Comparing passwords');
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', isMatch);
    } catch (bcryptErr) {
      console.error('Bcrypt compare error:', bcryptErr, 'User password:', user.password, 'Input password:', password);
      return res.status(500).json({ message: 'Password comparison failed' });
    }

    if (!isMatch) {
      console.log('Password does not match for user:', user._id);
      // await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password matched, resetting login attempts');
    // Reset login attempts on successful login
    // await user.resetLoginAttempts();

    console.log('Generating tokens');
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log('Storing refresh token');
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    console.log('Login successful for user:', user._id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("Login Error:", error, error.stack);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// ================= REFRESH TOKEN =================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === token);
    if (!tokenExists) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace old refresh token
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ================= LOGOUT =================
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const user = await User.findOne({ 'refreshTokens.token': refreshToken });
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
        await user.save();
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// ================= RESEND VERIFICATION =================
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ message: 'Server error during resend verification' });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  resendVerification,
};