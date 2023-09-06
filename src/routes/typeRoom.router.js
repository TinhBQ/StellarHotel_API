import express from 'express';
import { typeRoomController } from '../controllers/index.js';
import upload from '../middleware/uploadMedia.js';
import { verifyToken, isAdmin, isClient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', typeRoomController.filterTypeRooms);
router.patch ('/update-typeroom', verifyToken, isAdmin, upload.array('image', 10), typeRoomController.updateTypeRoom);
router.get('/get-total-typerooms', verifyToken, isAdmin, typeRoomController.getTotalTyperooms)

export default router;
