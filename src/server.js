// HTTP server bootstrap: attaches Vite in development, registers routes, then listens on PORT.
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer } from "vite";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { registerPaperboyyRoutes } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");

async function start() {
	await connectDatabase();

	const app = express();
	const httpServer = createHttpServer(app);

	if (!env.isProduction) {
		const vite = await createViteServer({
			root: repoRoot,
			server: {
				middlewareMode: true,
				hmr: { server: httpServer },
			},
			appType: "custom",
		});
		app.use(vite.middlewares);
	}

	registerPaperboyyRoutes(app);

	httpServer.on("error", (err) => {
		if (err.code === "EADDRINUSE") {
			console.error(
				`Port ${env.port} is already in use. Stop the other process using that port, or set PORT in .env to a free port.`,
			);
		} else {
			console.error(err);
		}
		process.exit(1);
	});

	httpServer.listen(env.port, () => {
		console.log(
			`Paperboyy listening on http://localhost:${env.port} (${env.nodeEnv})`,
		);
	});
}

start().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
