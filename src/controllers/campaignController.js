import Campaign from '../models/campaignModel.js';
import Site from '../models/siteModel.js';
import { getDuration } from '../utils/dateTimeUtils.js';
import ErrorResponse from '../utils/errorResponse.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new campaign
// @route   POST /api/v1/campaigns/create
// @access  Private
export const createCampaign = async (req, res, next) => {
  try {
    const {
      name,
      campaignType,
      brand,
      agency,
      industry,
      startDate,
      endDate,
      cost,
      description,
    } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'campaignType', 'brand', 'agency', 'industry'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return next(new ErrorResponse(`Please provide ${missingFields.join(', ')}`, 400));
    }

    // Create campaign
    const campaign = await Campaign.create({
      name,
      campaignType,
      brand,
      agency,
      industry,
      description,
      duration: getDuration(startDate, endDate) || 0,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      cost: cost || 0,
    });

    res.status(201).json({
      success: true,
      data: campaign
    });

  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      const message = 'Campaign with this name already exists';
      return next(new ErrorResponse(message, 400));
    }
    next(err);
  }
};

// @desc    Get all campaigns
// @route   GET /api/v1/campaigns
// @access  Private
export const getAllCampaigns = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Campaign.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Campaign.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const campaigns = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: campaigns.length,
      pagination,
      campaigns
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an Excel file from a campaign
// @route   DELETE /api/v1/campaigns/:campaignId/files/:fileId
// @access  Private
export const deleteCampaignFile = async (req, res, next) => {
  try {
    const { campaignId, fileId } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next(new ErrorResponse(`Campaign not found with id of ${campaignId}`, 404));
    }

    // Find the file to delete
    const fileIndex = campaign.excelFiles.findIndex(
      file => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return next(new ErrorResponse('File not found', 404));
    }

    const fileToDelete = campaign.excelFiles[fileIndex];
    
    // Remove file from database
    campaign.excelFiles.splice(fileIndex, 1);
    await campaign.save();

    // Delete file from filesystem
    const fs = await import('fs');
    const filePath = path.join(__dirname, `../../public${fileToDelete.url}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update campaign
// @route   PUT /api/v1/campaigns/update/:id
// @access  Private
export const updateCampaign = async (req, res, next) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(
        new ErrorResponse(`Campaign not found with id of ${req.params.id}`, 404)
      );
    }

    // Extract fields to update
    const {
      name,
      description,
      campaignType,
      startDate,
      endDate,
      cost,
      sites, // Array of site names
      ...otherFields
    } = req.body;
    // Build update object
    const updateFields = {};
    
    // Only update fields that are provided in the request
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (campaignType) updateFields.campaignType = campaignType;
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;
    if (cost !== undefined) updateFields.cost = cost;
    if (sites.length > 0) updateFields.sites = sites;
    
    // Handle other fields if needed
    Object.assign(updateFields, otherFields);

    // Update duration if dates are provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(campaign.startDate);
      const end = endDate ? new Date(endDate) : new Date(campaign.endDate);
      updateFields.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    }

    // Find and update campaign
    campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get campaign details
// @route   GET /api/v1/campaigns/:id
// @access  Private
export const getCampaignDetails = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new ErrorResponse(`Campaign not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload Excel files for a campaign
// @route   PUT /api/v1/campaigns/upload-excel
// @access  Private
export const uploadCampaignExcel = async (req, res, next) => {
  try {
    console.log(req.body);

    if (!req.body.files || req.body.files.length === 0) {
      return next(new ErrorResponse('Please upload at least one file', 400));
    }
    
    // Get campaign ID from either URL params or form data
    const campaignId = req.params.id || req.body.campaignId;
    const siteId = req.params.siteId || req.body.siteId;
    
    if (!campaignId) {
      return next(new ErrorResponse('Campaign ID is required', 400));
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next(new ErrorResponse(`Campaign not found with id of ${campaignId}`, 404));
    }

    // Process each uploaded file
    const uploadedFiles = req.body.files.map(file => ({
      url: file.url,
      originalName: file.fileName,
      uploadDate: new Date()
    }));
    
    const siteIndex = campaign.sites.findIndex(m => m.siteId.toString() === siteId);
    
    // Add new files to the campaign
    campaign.sites[siteIndex].excelFiles.push(...uploadedFiles);
    await campaign.save();

    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload monitoring data for a campaign
// @route   PUT /api/v1/campaigns/:id/monitoring
// @access  Private
export const uploadMonitoringData = async (req, res, next) => {
  try {
    const { siteId, date } = req.body;
    
    // Validate required fields
    if (!siteId) {
      return next(new ErrorResponse('Site ID is required', 400));
    }

    // Find the site to get siteName
    const site = await Site.findById(siteId);
    if (!site) {
      return next(new ErrorResponse(`Site not found with id of ${siteId}`, 404));
    }
    
    // Find the campaign
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return next(new ErrorResponse(`Campaign not found with id of ${req.params.id}`, 404));
    }

    // Prepare monitoring data
    const monitoringData = {
      date: date || new Date().toISOString(),
      uploadedVideo: req.body.files?.find(f => f.fileType.startsWith('video/'))?.filename || '',
      monitoringMedia: req.body.files
        ?.filter(f => f.fileType.startsWith('image/'))
        .map(file => ({
          type: req.body.monitoringType,
          originalName: file.fileName,
          url: file.url
        })) || []
    };

    // Check if monitoring entry exists for this site
    const siteIndex = campaign.sites.findIndex(m => m.siteId.toString() === siteId);
    
    campaign.sites[siteIndex].monitoringData.push(monitoringData);

    // Save the updated campaign
    await campaign.save();

    res.status(200).json({
      success: true,
      count: req.body.files.length,
      data: campaign
    });
  } catch (err) {
    console.error('Error uploading monitoring data:', err);
    next(err);
  }
};
