import jwt from "jsonwebtoken";

export default {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_USER: process.env.MONGODB_USER,
  MONGODB_PW: process.env.MONGODB_PW,
  JWT_SECRET: process.env.JWT_SECRET as jwt.Secret,
};
