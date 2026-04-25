// Express application wiring: views, static assets, routers, sessions, and centralized error handling.
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import { env } from "./config/env.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthApi from "./routes/api/health.js";
import browseApi from "./routes/api/browse.js";
import papersApi from "./routes/api/papers.js";
import searchApi from "./routes/api/search.js";
import bookmarksApi from "./routes/api/bookmarks.js";
import submissionsApi from "./routes/api/submissions.js";
import adminApi from "./routes/api/admin.js";
import publicPages from "./routes/pages/public.js";
import authLocalPages from "./routes/pages/authLocal.js";
import authPages from "./routes/pages/auth.js";
import adminPages from "./routes/pages/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerPaperboyyRoutes(app) {
	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));

	app.use((req, res, next) => {
		res.locals.isProduction = env.isProduction;
		next();
	});

	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(
		session({
			secret: process.env.SESSION_SECRET,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				sameSite: "lax",
			},
		}),
	);
	app.use((req, res, next) => {
		res.locals.currentUserId = req.session.userId ?? null;
		res.locals.isAdmin = req.session.isAdmin ?? false;
		next();
	});

	const publicDir = path.join(__dirname, "public");
	app.use(express.static(publicDir));

	app.use(publicPages);
	app.use(authLocalPages);
	app.use(authPages);
	app.use("/admin", adminPages);

	app.use("/api", healthApi);
	app.use("/api", browseApi);
	app.use("/api/papers", papersApi);
	app.use("/api/search", searchApi);
	app.use("/api/bookmarks", bookmarksApi);
	app.use("/api/submissions", submissionsApi);
	app.use("/api/admin", adminApi);

	app.use(notFound);
	app.use(errorHandler);
}
