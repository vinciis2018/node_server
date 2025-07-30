import mongoose from 'mongoose';

const siteLocationSchema = new mongoose.Schema({
  address: { type: String, default: "" },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  zipCode: { type: String, default: "" },
});

const siteSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  commonNames: { type: [String], default: ["LED"] },
  siteImages: { type: [String], default: ["https://imgs.search.brave.com/vatG32pjyOqEy4VWrBkooS-Ihe1tLXKRBIBTrpzeKFk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/dmlzdGFybWVkaWEu/Y29tL2h1YmZzL291/dCUyMG9mJTIwaG9t/ZSUyMGFkdmVydGlz/aW5nJTIwaW4lMjBQ/aWNjYWxpbGxpJTIw/U3F1YXJlLnBuZw"] },
  siteType: {
    type: String,
    required: [true, 'Site Type'],
    default: 'dooh'
  },
  siteLocation: {
    type: siteLocationSchema,
  },
}, {
  timestamps: true
});


const Site = mongoose.model('Site', siteSchema);

export default Site;
