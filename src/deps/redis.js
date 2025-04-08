const { createClient } = require('redis');
const { uuid } = require("../utils");

const TASK = "pubsub";
const SERVICE = "Redis";

async function createRedis({ redis_url } = {}) {
    console.log(`Loading ${SERVICE}...`);

    const client = createClient({ url: redis_url });
    client.on('end', () => console.log(`Desconectado do servidor ${SERVICE}`));
    client.on('connect', () => console.log(`Conectado ao servidor ${SERVICE}`));
    client.on('error', (err) => {
        console.error('Erro na conexão Redis:', err);
        throw new Error('Erro na conexão Redis:', { cause: err.message })
    });
    await client.connect();

    const subscriber = client.duplicate();
    subscriber.on('error', err => console.error('Erro na conexão Redis:', err));
    await subscriber.connect();

    console.log(`${SERVICE} Loaded.`);

    const set = async (key, value, options) => {
        return await client.set(key, value, options); //{ EX: 10 }
    }

    const get = async (key) => {
        return await client.get(key);
    }

    const del = async (key) => {
        return await client.del(key);
    }

    const trysub = async (channel) => {
        return await new Promise((resolve, reject) => {
            function resolveIt(data) {
                subscriber.unsubscribe(channel, this);
                resolve(data);
            }
            subscriber.subscribe(channel, resolveIt)//.catch((reason) => reject(reason))
        });

    }

    const pub = async (channel, message) => {
        await client.publish(channel, JSON.stringify(message));
    }

    const sub = async (channel) => {
        const messageString = await trysub(channel);
        return JSON.parse(messageString);
    }

    const unsub = async (channel) => {
        if (channel) return await client.unsubscribe(channel);
        return await client.unsubscribe();
    }

    const list = {
        add: async (key, ...values) => {
            return await client.rPush(key, ...values);
        },
        list: async (key, offset = 0, limit = -1) => {
            return await client.lRange(key, offset, limit);
        },
    }

    const hash = {
        set: async (key, object) => {
            const objectEntries = Object.entries(object).flat();
            return await client.hSet(key, ...objectEntries);
        },
        get: async (key) => {
            return await client.hGetAll(key);
        },
    }

    return {
        set,
        get,
        pub,
        sub,
        list,
        hash,
        unsub,
        delete: del,
    };
}

module.exports = createRedis;