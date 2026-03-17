require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv'); 
const bodyParser = require('body-parser');
const passport = require('passport');

dotenv.config();

const usersRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const plantRoutes = require("./routes/plant");
const fertilizerRoutes = require("./routes/fertilize");
const diseaseRoutes = require("./routes/disease");
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require('./routes/product')
const categoryRoutes = require('./routes/category')
const blogRoutes = require("./routes/blogRoutes");
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');


// call error handling
const globalError = require('./middlewares/globalError');
const AppError = require('./utils/appError');

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares 
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(passport.initialize()); 


// main route or project 
app.get('/', (req, res) => {
    res.send('Welcome to Gheras backend project!');
});

// routes of departments and features 
app.use('/api/users', usersRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizers", fertilizerRoutes);
app.use("/api/diseases", diseaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use("/api", blogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);





// error not found  404 
app.use((req, res, next) => {
    next(new AppError(`Can not find this route: ${req.originalUrl}`, 404));
});

// Global Error middleware 
app.use(globalError);


// connect to database
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI)
    .then(() => {
        console.log("Connected to MongoDB successfully!");
    })
    .catch((err) => {
        console.error("Connection error:", err.message);
    });

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});