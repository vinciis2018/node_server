import Site from '../models/siteModel.js';
import ErrorResponse from '../utils/errorResponse.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new site
// @route   POST /api/v1/sites/create
// @access  Private
export const createSite = async (req, res, next) => {
  try {
    const {
      siteName,
      commonName,
      siteImages,
      siteType,
      siteLocation,
    } = req.body;

    // Validate required fields
    const requiredFields = ['siteName', 'siteType', 'siteLocation'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return next(new ErrorResponse(`Please provide ${missingFields.join(', ')}`, 400));
    }

    // Create site
    const site = await Site.create({
      siteName,
      commonName,
      siteImages,
      siteType,
      siteLocation,
    });

    res.status(201).json({
      success: true,
      data: site
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

// @desc    Get site details
// @route   GET /api/v1/sites/:id
// @access  Private
// @desc    Get all sites
// @route   GET /api/v1/sites
// @access  Private
export const getAllSites = async (req, res, next) => {
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
    let query = Site.find(JSON.parse(queryStr));

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
    const total = await Site.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const sites = await query;

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
      count: sites.length,
      pagination,
      sites
    });
  } catch (err) {
    next(err);
  }
};

