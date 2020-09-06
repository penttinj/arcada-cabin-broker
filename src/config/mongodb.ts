/* eslint-disable no-new */
import mongoose from "mongoose";
import { MONGODB_PW, MONGODB_USER, MONGODB_URL } from ".";

export const initMongoDB = async () => new Promise((resolve, reject) => {
  const url = `mongodb+srv://${MONGODB_USER}:${MONGODB_PW}@${MONGODB_URL}`;
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
