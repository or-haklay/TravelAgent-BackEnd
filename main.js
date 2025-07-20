const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const errorLogger = require("./middleware/errorLogger");

require("dotenv").config();

const app = express();
app.use(cors());

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/users", require("./routes/users"));
app.use("/api/orders", require("./routes/orders"));

app.use(errorLogger);

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
