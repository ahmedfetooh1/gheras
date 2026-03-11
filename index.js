const dotenv = require('dotenv');
dotenv.config();

const connectDB = require("./config/db");
connectDB();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


let usersRoutes = require('./routes/user')
const plantRoutes = require("./routes/plant");
const fertilizerRoutes = require("./routes/fertilize");
const diseaseRoutes = require("./routes/disease");



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); 
app.use('/users', usersRoutes)
app.use("/plants", plantRoutes);
app.use("/fertilizers", fertilizerRoutes);
app.use("/diseases", diseaseRoutes);


app.use((req, res)=>{
    res.status(404).json({message:`${req.url} Not Found`})
})


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