import express from 'express';
import { createSite, getAllSites } from '../controllers/siteController.js';

const router = express.Router();

// // Apply protect middleware to all routes
// router.use(protect);

// Campaign routes
router.post('/create', createSite);

router.get('/all', getAllSites);



export default router;
