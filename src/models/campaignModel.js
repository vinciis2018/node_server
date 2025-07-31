import mongoose from 'mongoose';


const excelFilesSchema = new mongoose.Schema({
  url: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now() }
});

const monitoringMediaSchema = new mongoose.Schema({
  type: { type: String, default: "" },
  originalName: { type: String, default: "" },
  url: { type: String, default: "" },
});

const monitoringDataSchema = new mongoose.Schema({
  date: { type: String, default: Date.now() },
  uploadedVideo: { type: String, default: "" },
  monitoringMedia: { type: [monitoringMediaSchema], default: [] },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const siteSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  siteName: { type: String, default: "" },
  siteType: { type: String, default: "" },
  monitoringData: { type: [monitoringDataSchema], default: [] },
  excelFiles: { type: [excelFilesSchema], default: []},
});

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  campaignType: {
    type: String,
    required: [true, 'Campaign Type'],
    default: 'dooh'
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand name'],
    trim: true,
    maxlength: [50, 'Brand cannot be more than 50 characters']
  },
  agency: {
    type: String,
    required: [true, 'Please add an agency name'],
    trim: true,
    maxlength: [50, 'Agency cannot be more than 50 characters']
  },
  industry: {
    type: String,
    required: [true, 'Please add an industry'],
    trim: true,
    maxlength: [50, 'Industry cannot be more than 50 characters']
  },
  description: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  startDate: { type: String, default: Date.now() },
  endDate: { type: String, default: Date.now() },
  cost: { type: Number, default: 0 },
  bounty: { type: Object, default: {} },
  sites: [siteSchema],
}, {
  timestamps: true
});


const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
