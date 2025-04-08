const Server = require("./server");
const deps = require("./deps");
const configs = require("./configs");
const routers = require("./routers");

async function app() {

    const depInstances = {};
    for (const [key, Dep] of Object.entries(deps)) {
        depInstances[key] = await Dep(configs);
    }

    const server = await Server({ deps: depInstances, routers, configs });

    return server;
}

app();
