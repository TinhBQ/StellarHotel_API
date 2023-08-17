import { roomController } from '../controllers/index.js';
import express from 'express';
import { validationError, roomValidation } from '../middleware/validation/index.js';
import upload from '../middleware/uploadMedia.js';
import { verifyToken, isAdmin, isClient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
    '/',
    roomValidation.validateGetNumberAvailableRooms,
    validationError,
    roomController.getNumberAvailableRooms,
);
router.post('/add-room', upload.single('image'), roomController.addRoom);
router.patch('/update', roomController.updateRoom);

export default router;
