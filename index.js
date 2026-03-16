const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv'); 
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config();

let usersRoutes = require('./routes/user')
const paymentRoutes = require('./routes/payment');
<<<<<<< Updated upstream
=======
const productRoutes = require('./routes/product');
const plantRoutes = require("./routes/plant");
const fertilizerRoutes = require("./routes/fertilize");
const diseaseRoutes = require("./routes/disease");
const dashboardRoutes = require("./routes/dashboard");
const cartRouter = require("./routes/cart");

>>>>>>> Stashed changes

const app = express();
const passport = require('passport');
const PORT = process.env.PORT || 3000;



app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(passport.initialize()); // Initialize Passport
app.use('/users', usersRoutes)

<<<<<<< Updated upstream
app.use('/users', usersRoutes);
app.use('/api', paymentRoutes);

app.use((req, res) => {
    res.status(404).json({ message: `${req.url} Not Found` })
})
=======
 
app.use('/api/users', usersRoutes)
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizers", fertilizerRoutes);
app.use("/api/diseases", diseaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/cart", cartRouter)
app.use("/api/products", productRoutes)




>>>>>>> Stashed changes


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