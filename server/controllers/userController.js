import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { email, password, phone, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      phone,
      role: role || 'user',
      emailVerified: false,
      phoneVerified: false,
    });

    if (user) {
      // Generate verification token (6-digit number)
      const emailToken = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send verification email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email for SAVAYAS HEALS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a9d8e;">SAVAYAS HEALS</h2>
            <p>Thank you for registering with SAVAYAS HEALS. Please verify your email address by entering the following code:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
              <strong>${emailToken}</strong>
            </div>
            <p>This code will expire in 30 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Best regards,<br>The SAVAYAS HEALS Team</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);

      // Return user data and token
      res.status(201).json({
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Verify user email
// @route   POST /api/users/verify/email
// @access  Private
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real app, you would validate the token against a stored value
    // For demo purposes, we'll just check if it's the right length
    if (token.length !== 6) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Update user's email verification status
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.emailVerified = true;
    await user.save();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Verify user phone
// @route   POST /api/users/verify/phone
// @access  Private
export const verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    
    // In a real app, you would validate the OTP against a stored value
    // For demo purposes, we'll just check if it's the right length
    if (otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Update user's phone verification status
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.phoneVerified = true;
    await user.save();
    
    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Update fields if provided
      user.email = req.body.email || user.email;
      
      if (req.body.phone && req.body.phone !== user.phone) {
        user.phone = req.body.phone;
        user.phoneVerified = false; // Require re-verification for new phone
      }
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Send verification email
// @route   POST /api/users/send/email-verification
// @access  Private
export const sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate a verification token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Verify your email for SAVAYAS HEALS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a9d8e;">SAVAYAS HEALS</h2>
          <p>Thank you for registering with SAVAYAS HEALS. Please verify your email address by entering the following code:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${token}</strong>
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br>The SAVAYAS HEALS Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

// @desc    Send phone verification OTP
// @route   POST /api/users/send/phone-verification
// @access  Private
export const sendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate an OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, you would use the 2Factor API to send the OTP
    // For demo purposes, we'll just return the OTP in the response
    
    // Simulate sending OTP via 2Factor API
    console.log(`Sending OTP ${otp} to ${user.phone}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      // In a production app, you would NOT return the OTP in the response
      // This is just for demo purposes
      otp 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};