// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const signupRouter = require('./routes/signuproutes');
// const port = 4000;
// const password = "ZB6iMXlhEuV5TlxA"
// const url = "mongodb+srv://haiderkamran2:ZB6iMXlhEuV5TlxA@cluster0.56yovzm.mongodb.net/"
// const app = express();


// app.use(bodyParser.json());


// mongoose.connect(url, {
 
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));


// app.use('/signup', signupRouter);



// app.listen(port, () => {
//   console.log(`Server running on port ${PORT}`);
// });



// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const signupRouter = require('./routes/signuproutes');
// const forgotPasswordRoutes = require('./routes/forgetPassword');
// const  loginRoutes = require("./routes/login")
// const profileRoutes = require('./routes/ProfileRoutes');
// const path = require('path');
// const upload= require("./multer/multer")
// const authRoutes = require('./routes/auth');


// const cors= require("cors")
// const PORT = 4000
// const url = "mongodb+srv://haiderkamran2:ZB6iMXlhEuV5TlxA@cluster0.56yovzm.mongodb.net/"

// const app = express();

// // Middleware
// app.use(bodyParser.json());

// app.use(cors({
//   origin: 'http://localhost:5173', // Your frontend URL
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['Authorization'],
//   credentials: true
// }));
// app.options('*', cors());
// // app.use(cors())
// // Database connection
// mongoose.connect(url, {
  
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/signup', signupRouter);
// app.use('/api/login', loginRoutes);
// app.use('/api/forgot-password', forgotPasswordRoutes);
// app.use('/api/profile', profileRoutes);
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/auth', authRoutes);



// const fs = require('fs');
// const uploadDir = './uploads';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }
// // Start server

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const signupRouter = require('./routes/signuproutes');
const forgotPasswordRoutes = require('./routes/forgetPassword');
const loginRoutes = require("./routes/login");
const profileRoutes = require('./routes/ProfileRoutes');

// const authRoutes = require('./routes/auth');
// const driverRoutes = require('./routes/driverRoutes');


const path = require('path');
const upload = require("./multer/multer");
const authRoutes = require('./routes/auth');
const cors = require("cors");
require('dotenv').config();



const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://haiderkamran2:ZB6iMXlhEuV5TlxA@cluster0.56yovzm.mongodb.net/";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes); // This should handle login
app.use('/api/signup', signupRouter);

app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/drivers', driverRoutes);



// Ensure upload directory exists
// const fs = require('fs');
// const uploadDir = './uploads';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});