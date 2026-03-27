const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const createRateLimiter = require("./middlewares/rateLimitMiddleware");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "*")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const corsOptions = {
	origin(origin, callback) {
		if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		const err = new Error("CORS origin not allowed");
		err.status = 403;
		return callback(err);
	},
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
	createRateLimiter({
		windowMs: 15 * 60 * 1000,
		max: 300,
		message: "Too many requests, try again later",
	})
);

app.use("/api", require("./routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;