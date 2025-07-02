require('dotenv').config(); // Add this line at the top
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Environment variables for the Supervity API
const API_URL = 'https://docser.supervity.ai/app/QueryDocument';
const ORG_ID = process.env.SUPERVITY_ORG_ID;
const API_TOKEN = process.env.SUPERVITY_API_TOKEN;
const API_ORG = process.env.SUPERVITY_API_ORG;
const COLLECTION_NAME = process.env.SUPERVITY_COLLECTION_NAME;

// Check if required environment variables are present
if (!ORG_ID || !API_TOKEN || !API_ORG || !COLLECTION_NAME) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chatbot', async (req, res) => {
    const { question } = req.body;

    if (!question || question.trim() === '') {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        // Prepare the request payload for Supervity API
        const formData = new URLSearchParams();
        formData.append('question', question);
        formData.append('collectionName', COLLECTION_NAME);
        formData.append('jsonData', '');
        formData.append('documentName', '');
        formData.append('usertype', process.env.SUPERVITY_USERTYPE || 'team');
        formData.append('chat_context', '');

        console.log('Making request to Supervity API with:', {
            orgId: ORG_ID,
            collectionName: COLLECTION_NAME,
            question: question.substring(0, 50) + '...'
        });

        // Make the API call to Supervity QueryDocument API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-orgId': ORG_ID,
                'X-Api-Token': API_TOKEN,
                'X-Api-Org': API_ORG,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        // Parse the response
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from Supervity API:', errorText);
            return res.status(response.status).json({ 
                error: `Failed to fetch data from Supervity API: ${response.status}` 
            });
        }

        const data = await response.json();
        console.log('Received response from Supervity API');

        // Send the response back to the frontend
        res.json({ response: data.response || 'No response received' });
    } catch (error) {
        console.error('Error querying Supervity API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
});