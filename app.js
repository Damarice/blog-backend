// app.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Blog = require('./models/Blog'); // Ensure the correct model path

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, uploadDir))); // Serve uploaded files

// Basic logger middleware (optional)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Use the defined upload directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage });

// Route to create a new blog post
app.post('/api/blogs', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    const { title, content } = req.body;
    const uploadedImagePath = req.files.image ? req.files.image[0].path : null; // Get the uploaded image path if available
    const uploadedAudioPath = req.files.audio ? req.files.audio[0].path : null; // Get the uploaded audio path if available

    try {
        const newBlog = new Blog({
            title,
            content,
            image: uploadedImagePath, // Use uploaded image file path
            audio: uploadedAudioPath // Use uploaded audio file path
        });
        await newBlog.save();
        res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Error creating blog post', error });
    }
});

// Route to get all blog posts
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error retrieving blog posts:', error);
        res.status(500).json({ message: 'Error retrieving blog posts', error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
