/* eslint-disable no-new */
import mongoose from "mongoose";
import config from ".";

export const initMongoDB = async () => new Promise((resolve, reject) => {
  const url = `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PW}@${config.MONGODB_URL}`;
  mongoose.connect(
    url,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
  )
    .then(() => {
      console.log(`Connected to MongoDB at ${url}`);
      resolve(true);
    })
    .catch((err) => {
      reject(err);
    });
});
