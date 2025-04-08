const WebSocket = require('ws');
const { uuid } = require("../utils");
const APIError = require('../errors/api-error');

/**
 * @typedef {() => Promise} RouteController
 */

/**
 *
 * @param {{deps: Object, server: Object, routes: Array<[string, RouteController]>}} params
 * @returns
 */
async function createWebsocket({ deps, server, routes: baseRoutes = [] }, { ws_path }) {
    const { redis } = deps;
    const wss = new WebSocket.Server({ server, path: ws_path });
    /** @type {Map<string, RouteController>} */
    const routes = new Map(baseRoutes.map((route) => [route.path, route]));

    /**
     *
     * @param {string} path
     * @returns {RouteController}
     */
    function get(path) {
        return routes.get(path);
    }

    /**
     *
     * @param {string} path
     * @param {RouteController} callback
     */
    function add(path, callback) {
        routes.set(path, callback);
    }

    /**
     *
     * @param {string} path
     */
    function remove(path) {
        routes.delete(path);
    }

    wss.on("connection", (socket) => {
        const userid = uuid();
        const events = {};

        async function sub(event_id, callback) {
            return await new Promise((resolve, reject) => {
                events[event_id] = (data) => resolve(JSON.parse(data)); //subscriber.subscribe(channel, resolve)//.catch((reason) => reject(reason))
            });
        }

        async function pub(event_id, message) {
            await events[event_id]?.(JSON.stringify(message));
        }

        console.log(`User ${userid} connected.`);

        socket.on("disconnect", () => {
            console.log(`User ${userid} disconnected.`);
        });

        const send = ({ id = uuid(), ...message }) => {
            socket.send(JSON.stringify({
                ...message,
                id,
            }));

            return id;
        }

        const ack = (message) => {
            return send({
                userid: message,
                id: message.id,
                event: message.event,
            });
        }

        send({
            userid,
            event: "auth",
        });

        socket.on("message", async (chunk) => {
            try {
                let message = JSON.parse(chunk);

                try {
                    const route = get(message.path);
                    if (route) {
                        if (!route.handler) throw new APIError({ service: "Router", cause: "not exists", detail: message.path });


                        if (message.event_id) {
                            return await pub(message.event_id, message);
                        }

                        const event_id = uuid();
                        message = {
                            ...message,
                            event_id,
                        };

                        send({
                            event_id,
                            id: message.id,
                            path: message.path,
                            event: message.event,
                            userid: message.userid,
                        });

                        await route.handler(
                            deps,
                            {
                                res: {
                                    send,
                                    sub: async (event) => {
                                        let data = null;
                                        do {
                                            data = await sub(event_id);
                                        } while (data && data.event !== event);
                                        return data;
                                    },
                                    pub: async (data) => await pub(event_id, data),
                                },
                            },
                            message
                        );
                    }
                } catch (error) {
                    send({
                        userid,
                        id: message.id,
                        event: "error",
                        error: error.message,
                        event_id: message.event_id,
                    });

                    if (error instanceof APIError) error?.print();
                    else console.log(error);
                }
            } catch (error) {
                send({
                    userid,
                    event: "error",
                    error: error.message,
                });
                socket.close();

                if (error instanceof APIError) error?.print();
                else console.log(error);
            }
        });
    });

    return {
        get,
        add,
        remove,
        baseRoutes,
    };
}

module.exports = createWebsocket;