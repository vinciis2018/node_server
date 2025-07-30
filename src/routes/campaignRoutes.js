import express from 'express';
import { 
  createCampaign, 
  getAllCampaigns, 
  getCampaignDetails, 
  uploadCampaignExcel,
  deleteCampaignFile,
  updateCampaign,
  uploadMonitoringData
} from '../controllers/campaignController.js';
import { uploadExcelFiles } from '../utils/excelFileUpload.js';
import { uploadMonitoringMedia } from '../utils/monitoringUpload.js';

const router = express.Router();

// // Apply protect middleware to all routes
// router.use(protect);

// Campaign routes
router.post('/create', createCampaign);

router.get('/all', getAllCampaigns);

router.get('/:id', getCampaignDetails);

// Delete a file from a campaign
router.delete(
  '/:campaignId/files/:fileId',
  deleteCampaignFile
);

// Update a campaign
router.put(
  '/update/:id',
  updateCampaign
);

// Upload multiple Excel files for a campaign
router.put(
  ['/upload-excel', '/:id/upload-excel'],
  uploadExcelFiles,
  uploadCampaignExcel
);

// Upload monitoring data for a campaign
router.put(
  ['/monitoring-media', '/:id/monitoring-media'],
  uploadMonitoringMedia,
  uploadMonitoringData
);

export default router;
