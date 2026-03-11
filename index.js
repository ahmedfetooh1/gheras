const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv'); 
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config();

let usersRoutes = require('./routes/user')
const paymentRoutes = require('./routes/payment');
const plantRoutes = require("./routes/plant");
const fertilizerRoutes = require("./routes/fertilize");
const diseaseRoutes = require("./routes/disease");

const app = express();
const passport = require('passport');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(passport.initialize()); // Initialize Passport
app.use('/users', usersRoutes)
app.use("/plants", plantRoutes);
app.use("/fertilizers", fertilizerRoutes);
app.use("/diseases", diseaseRoutes);

app.use('/users', usersRoutes);
app.use('/api', paymentRoutes);

app.use((req, res) => {
    res.status(404).json({ message: `${req.url} Not Found` })
})


const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => {
        console.log("Connected to MongoDB Atlas successfully!");
    })
    .catch((err) => {
        console.error("Connection error:", err.message);
    });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});