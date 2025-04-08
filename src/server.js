const http = require("node:http");
const path = require("node:path");
const express = require("express");

async function createServer({ routers, deps, configs }) {
    const app = express();

    app.use(express.json());

    const staticPage = path.resolve(__dirname, "../public");

    app.use(express.static(staticPage));

    const server = http.createServer(app);

    const routersInstances = {};
    for (const [key, { engine, routes, deps: depsKeys }] of Object.entries(routers)) {
        const routeDeps = Object.entries(deps).filter(([key]) => depsKeys.includes(key));
        routersInstances[key] = await engine({ server, deps: Object.fromEntries(routeDeps), routes }, configs);
    }

    server.listen(configs.port, () => {
        console.log(`Server running\nhttp://localhost:${configs.port}`);
    });

    return { app, deps, engines: routers, configs };
}

module.exports = createServer;