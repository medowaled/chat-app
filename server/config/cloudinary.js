const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

// Ensure ENV vars are loaded if this file is imported early
dotenv.config();

let storage;
let upload;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'chat_pwa_uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4'],
        },
    });

    upload = multer({ storage: storage });
} else {
    console.log('Cloudinary config missing. Using local storage as fallback.');
    const fs = require('fs');
    const path = require('path');

    // Ensure the uploads directory exists
    const uploadPath = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const localStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    });
    upload = multer({ storage: localStorage });
}

module.exports = { cloudinary, upload };
