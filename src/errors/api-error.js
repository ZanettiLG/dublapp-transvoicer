/**
 * @typedef {{
 *  service: string,
 *  detail: string,
 *  cause: string,
 *  userid?: string,
 *  field?: string,
 *  path?: string,
 * }} APIErrorData
 */

class APIError extends Error {
    service;
    detail;
    userid;
    cause;
    field;
    path;

    /**
     *
     * @param {APIErrorData} data
     */
    constructor({
        message,
        service,
        detail,
        userid,
        cause,
        field,
        path,
    }) {
        this.cause = cause;
        this.detail = detail;
        this.service = service;
        this.message = message;
        this.path = path || null;
        this.field = field || null;
        this.userid = userid || null;
        this.name = `${service} Error`;
    }

    print() {
        console.log(`
            ${this.name}:
            ${this.path ? `- ${this.path}` : ""}
            ${this.userid ? `- ${this.userid}` : ""}
            ${this.field ? `- ${this.field}` : ""}
            - ${this.cause}
            - ${this.detail}
            ${this.message}
            traceback: ${this.stack}
        `);
    }

    toJSON() {
        return {
            name: this.name,
            path: this.path,
            field: this.field,
            cause: this.cause,
            userid: this.userid,
            detail: this.detail,
            service: this.service,
            message: this.message,
        };
    }

}

module.exports = APIError;