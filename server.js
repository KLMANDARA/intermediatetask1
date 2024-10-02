const express = require('express');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const shortid = require('shortid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// URL Schema
const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 }
});

const Url = mongoose.model('Url', urlSchema);

// Shorten URL endpoint
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    
    if (!validUrl.isUri(originalUrl)) {
        return res.status(401).json('Invalid URL');
    }

    const shortUrl = shortid.generate();
    const newUrl = new Url({ originalUrl, shortUrl });

    try {
        await newUrl.save();
        res.json({ originalUrl, shortUrl: `${req.protocol}://${req.get('host')}/${shortUrl}` });
    } catch (err) {
        res.status(500).json('Server error');
    }
});

// Redirect to original URL
app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const url = await Url.findOne({ shortUrl });
        if (url) {
            url.clicks++;
            await url.save();
            return res.redirect(url.originalUrl);
        }
        res.status(404).json('URL not found');
    } catch (err) {
        res.status(500).json('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
