const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require('express-session');
const userRoute = require("./routes/user")
const prodRoute = require("./routes/product")
const dealRoute = require("./routes/dealer")
const orderRoute = require("./routes/order")
const dashboardRoute = require("./routes/dashboard")


app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: '50mb' }));

// Generate a salt
const saltRounds = 10; 
require("dotenv").config({
  path: "config/.env",
});

const server = app.listen(process.env.PORT, () => {
  console.log(`server is running on: ${process.env.PORT}`);
});

server.keepAliveTimeout = 3000;

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  },
}));

//unhandle promise rejection
process.on("unhandleRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});

app.use("/api/user",userRoute)
app.use("/api/prod",prodRoute)
app.use("/api/dealer",dealRoute)
app.use("/api/order", orderRoute)
app.use("/api/dashboard", dashboardRoute)



//errorhandling
app.use(ErrorHandler);
