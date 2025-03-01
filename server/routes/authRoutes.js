import express from 'express';
import { 
  registerUser, 
  registerProfessional, 
  loginUser, 
  loginProfessional, 
  refreshToken, 
  logout,
  getCurrentUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  validate, 
  userRegisterSchema, 
  professionalRegisterSchema, 
  loginSchema, 
  refreshTokenSchema 
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// User routes
router.post('/user/register', validate(userRegisterSchema), registerUser);
router.post('/user/login', validate(loginSchema), loginUser);

// Professional routes
router.post('/professional/register', validate(professionalRegisterSchema), registerProfessional);
router.post('/professional/login', validate(loginSchema), loginProfessional);

// Common routes
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

export default router;