import express from 'express';
import { analyzeLogsFromExcel, analyzeMonitoringData } from '../controllers/analyticsController.js';

const router = express.Router();

// // Apply protect middleware to all routes
// router.use(protect);

// Campaign routes
router.get('/getAnalyticsFromExcel/:id/:siteId?', analyzeLogsFromExcel);
router.get('/analyseMonitoringData/:id/:siteId?', analyzeMonitoringData)



export default router;
