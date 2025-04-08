const WebSocket = require('ws');
const { uuid } = require("../utils");

/**
 * @typedef {{
 *  type: string,
 *  id: string,
 *  data?: Object
 * }} Message
 */

/**
 *
 * @param {{
 *  url: string,
 *  onConnect: () => void,
 *  onError: () => void,
 *  onDisconnect: () => void
 * }} params
 * @returns
 */
async function createWebsocketClient({ url, onConnect, onError, onDisconnect }) {
    const listeners = new Map();

    const websocket = await new Promise((resolve, reject) => {
        const socket = new WebSocket(url);

        const ping = (timeout = 10000) => setTimeout(() => socket.ping(), timeout);

        socket.on('pong', () => {
            //console.log("Receive Pong");
            ping();
        });

        socket.on('open', () => {
            onConnect?.();
            ping();
            resolve(socket);
        });

        // Evento de erro
        socket.on('error', (err) => {
            onError?.(err);
            reject(err);
        });

        socket.on('close', (data) => {
            onDisconnect?.(data);
            reject(data);
        })
    });

    /**
     *
     * @param {Message} params
     * @returns
     */
    function invoke({ data, type, id }) {
        const typeListeners = listeners.get(type);
        if (!typeListeners) return;

        if (!id) {

            for (const listener of typeListeners.values()) {
                listener(data);
            }
            return;
        }

        const listener = typeListeners.get(id);
        listener(data);
    }

    /**
     *
     * @param {(message: Message) => void} callback
     * @param {string} type
     * @param {string?} id
     * @returns
     */
    function addListener(callback, type, id) {
        let typeListeners = listeners.get(type);
        if (!typeListeners) {
            listeners.set(type, new Map([[id, callback]]));
            return;
        }
        typeListeners.set(id, callback);
    }

    /**
     *
     * @param {string} type
     * @param {string?} id
     * @returns
     */
    function removeListener(type, id) {
        const typeListeners = listeners.get(type);
        if (!typeListeners) return;
        if (!id) {
            listeners.delete(type);
            return;
        }
        typeListeners.delete(id);
    }

    // Evento de recebimento de mensagem
    websocket.on('message', (data) => {
        console.log(data);
        invoke(JSON.parse(data))
    });

    /**
     *
     * @param {string} type
     * @param {string?} id
     * @returns {Promise<Message>}
     */
    async function waitFor(type, id) {
        const result = await new Promise((resolve, reject) => addListener(resolve, type, id));
        removeListener(type, id);
        return { type, id, data: result };
    }

    /**
     *
     * @param {string} type
     * @param {object} data
     * @returns
     */
    async function send(type, data) {
        const id = uuid();
        const message = {
            id,
            type,
            data,
        }
        websocket.send(JSON.stringify(message));
        return await waitFor(type, id);
    }

    return {
        send,
        invoke,
        waitFor,
        addListener,
        removeListener,
    }
}

module.exports = createWebsocketClient;