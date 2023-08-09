import WebSocket from "ws";
import EventEmitter from "events";
import type { Promisify } from "./types";
import type { API as ServerAPI } from "../server/index";
import { randomUUID } from "crypto";

type SocketOptions = {
  token?: string;
  API: Record<string, Function>;
};

type PromisifiedServerAPI = Promisify<typeof ServerAPI>;

class Socket {
  ws: WebSocket | null = null;
  private responseEvents = new EventEmitter();
  events = new EventEmitter();

  constructor(
    public url: string,
    private options?: SocketOptions,
  ) { }

  connect() {
    const headers: Record<string, any> = {};
    if (this.options?.token) {
      headers.Authorization = this.options.token;
    }

    this.ws = new WebSocket(this.url, {
      headers,
    });

    this.ws.on("open", () => {
      this.events.emit("open");
    });

    this.ws.on("close", () => {
      this.events.emit("close");
    });

    this.ws.on("message", (message) => {
      try {
        const payload = JSON.parse(Buffer.from(message as Buffer).toString());
        if (!payload.event && payload.id) {
          this.responseEvents.emit(payload.id, payload.response);
        } else {
          const func = this.options?.API[payload.event];
          if (func) {
            func(...payload.args);
          }
        }
        this.events.emit("message", payload);
      } catch (error) {
        console.error("Unable to parse message");
      }
    });

    this.ws.on("error", (error) => {
      this.events.emit("error", error);
    });
  }

  rpc: PromisifiedServerAPI = new Proxy({} as PromisifiedServerAPI, {
    get: (_target, event) => {
      return async (...args: any[]) =>
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.responseEvents.off(`${id}-resolve`, onResolve);
            reject("timed_out");
          }, 10000);

          const onResolve = (response: any[]) => {
            this.responseEvents.off(`${id}-reject`, reject);
            clearTimeout(timeout);
            resolve(response);
          };

          const onReject = (error: any) => {
            this.responseEvents.off(`${id}-resolve`, onResolve);
            clearTimeout(timeout);
            reject(error);
          };

          const id = randomUUID();
          this.ws?.send(JSON.stringify({ event, args, id }));
          this.responseEvents.once(`${id}-resolve`, onResolve);
          this.responseEvents.once(`${id}-reject`, onReject);
        });
    },
  });
}

export default Socket;
