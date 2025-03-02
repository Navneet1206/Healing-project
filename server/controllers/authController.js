import User from '../models/User.js';
import Professional from '../models/Professional.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtUtils.js';
import { AppError } from '../middleware/errorMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();
// Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Helper function to send tokens
const sendTokenResponse = (user, statusCode, res) => {
  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // Save refresh token to database
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });
  
  // Set cookies
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // Send response
  res.status(statusCode).json({
    status: 'success',
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/user/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists with this email', 400));
    }
    
    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'user'
    });
    
    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register professional
// @route   POST /api/auth/professional/register
// @access  Public
export const registerProfessional = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      specialization, 
      licenseNumber, 
      yearsOfExperience, 
      bio 
    } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists with this email', 400));
    }
    
    // Create new user with professional role
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'professional'
    });
    
    // Create professional profile
    await Professional.create({
      user: user._id,
      specialization,
      licenseNumber,
      yearsOfExperience,
      bio
    });
    
    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login professional
// @route   POST /api/auth/professional/login
// @access  Public
export const loginProfessional = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists and is a professional
    const user = await User.findOne({ email, role: 'professional' });
    if (!user) {
      return next(new AppError('Invalid credentials or not a professional account', 401));
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }
    
    // Check if professional profile exists and is approved
    const professional = await Professional.findOne({ user: user._id });
    if (!professional) {
      return next(new AppError('Professional profile not found', 404));
    }
    
    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user with the refresh token
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshToken 
    });
    
    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }
    
    // Generate new tokens
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save({ validateBeforeSave: false });
    }
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      isVerified: req.user.isVerified
    }
  });
};