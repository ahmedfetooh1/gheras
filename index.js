const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;  nn

app.use(express.json());
app.use(cors()); 

const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => {
        console.log("Connected to MongoDB Atlas successfully!");
    })
    .catch((err) => {
        console.error("Connection error:", err.message);
    });

app.get('/', (req, res) => {
    res.send('Welcome to my backend project, Hamoudi!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});