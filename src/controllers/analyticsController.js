import Campaign from '../models/campaignModel.js';
import ErrorResponse from '../utils/errorResponse.js';
import { readExcelFromLocalUrl } from '../utils/fileUtils.js';

// @desc    Analyze logs from uploaded Excel file
// @route   GET /api/v1/analytics/getAnalyticsFromExcel/:id/:siteId
// @access  Private
export const analyzeLogsFromExcel = async (req, res, next) => {
  try {
    const { id, siteId } = req.params;
    
    // Find the campaign and site
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return next(new ErrorResponse('Campaign not found', 404));
    }
    
    const site = campaign.sites.find(site => site.siteId.toString() === siteId);
    if (!site) {
      return next(new ErrorResponse('Site not found in this campaign', 404));
    }
    
    // Check if there are any Excel files
    if (!site.excelFiles || site.excelFiles.length === 0) {
      return next(new ErrorResponse('No Excel files found for this site', 404));
    }
    
    // Read the first Excel file
    const excelFile = site.excelFiles[0];
    
    try {
      const result = await readExcelFromLocalUrl(excelFile.url);
      
      if (result.error) {
        return next(new ErrorResponse(result.error, 400));
      }
      
      // Process the Excel data with multiple sheets
      const analysisResult = {
        campaignId: id,
        siteId,
        siteName: site.siteName,
        fileName: excelFile.originalName,
        stats: result.stats,
        sheets: result.sheets.map(sheet => ({
          sheetName: sheet.sheetName,
          headers: sheet.data.headers,
          rowCount: sheet.stats.rowCount,
          columnCount: sheet.stats.columnCount,
          firstRow: sheet.stats.firstRow,
          lastRow: sheet.stats.lastRow,
          rows: sheet.stats.rows
        })),
        // For backward compatibility, include first sheet data
        data: result.data,
      };
      
      res.status(200).json({
        success: true,
        data: analysisResult
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return next(new ErrorResponse('Failed to process Excel file', 500));
    }
    
  } catch (err) {
    console.error('Error in analyzeLogsFromExcel:', err);
    next(err);
  }
};


export const analyzeMonitoringData = async (req, res, next) => {
  try {

  } catch (error) {
      
  }
}