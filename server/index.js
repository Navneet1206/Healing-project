import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`- ${varName}`));
  console.error('Please check your .env file and restart the server.');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials are missing. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email transport connection
transporter.verify((error) => {
  if (error) {
    console.error('Email transport error:', error);
  } else {
    console.log('Email transport is ready to send messages');
  }
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SAVAYAS HEALS API is running' });
});

// Email verification endpoint
app.post('/api/verify/email', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }
    
    // In a real app, you would validate the token against a stored value
    // For demo purposes, we'll just check if it's the right length
    if (token.length !== 6) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (userError) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update the user's email_verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userData.id);
      
    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify email' });
    }
    
    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Phone verification endpoint
app.post('/api/verify/phone', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    // In a real app, you would validate the OTP against a stored value or use 2Factor API
    // For demo purposes, we'll just check if it's the right length
    if (otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Find the user by phone
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
      
    if (userError) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update the user's phone_verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({ phone_verified: true })
      .eq('id', userData.id);
      
    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify phone' });
    }
    
    return res.status(200).json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Phone verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send verification email
app.post('/api/send/email-verification', async (req, res) => {
  try {
    const { email, userId } = req.body;
    
    if (!email || !userId) {
      return res.status(400).json({ error: 'Email and userId are required' });
    }
    
    // Generate a verification token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, you would store this token in the database with an expiry
    // For demo purposes, we'll just send it in the email
    
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
            <strong>${token}</strong>
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br>The SAVAYAS HEALS Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Send verification SMS
app.post('/api/send/phone-verification', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Generate an OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, you would use the 2Factor API to send the OTP
    // For demo purposes, we'll just return the OTP in the response
    
    // Simulate sending OTP via 2Factor API
    console.log(`Sending OTP ${otp} to ${phone}`);
    
    return res.status(200).json({ 
      message: 'OTP sent successfully',
      // In a production app, you would NOT return the OTP in the response
      // This is just for demo purposes
      otp 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Create Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount || !receipt) {
      return res.status(400).json({ error: 'Amount and receipt are required' });
    }
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes
    };
    
    const order = await razorpay.orders.create(options);
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify Razorpay payment
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'All payment details are required' });
    }
    
    // Verify the payment signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
      
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
    
    // Payment is valid, update the database
    // In a real app, you would update the payment status in your database
    
    return res.status(200).json({ 
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Send appointment confirmation email
app.post('/api/send/appointment-confirmation', async (req, res) => {
  try {
    const { email, appointment } = req.body;
    
    if (!email || !appointment) {
      return res.status(400).json({ error: 'Email and appointment details are required' });
    }
    
    // Format date and time
    const date = new Date(appointment.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const startTime = appointment.start_time.substring(0, 5);
    const endTime = appointment.end_time.substring(0, 5);
    
    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Appointment Confirmation - SAVAYAS HEALS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a9d8e;">SAVAYAS HEALS</h2>
          <p>Your appointment has been confirmed!</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Professional:</strong> ${appointment.professional_name}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          <p>Please arrive 5 minutes before your scheduled time. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          <p>Best regards,<br>The SAVAYAS HEALS Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Send confirmation email error:', error);
    return res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;