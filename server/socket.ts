import { App, TemplatedApp, WebSocket as uWebSocket } from "uWebSockets.js";
import { Promisify } from "./types";
import type { API as ClientAPI } from "../client/index";
import EventEmitter from "events";
import { randomUUID } from "crypto";

type PromisifiedClientAPI = Promisify<typeof ClientAPI>;
export type WebSocket = uWebSocket<unknown> & {
  client: PromisifiedClientAPI;
  id: string;
};
export type Context = { socket: WebSocket; app: TemplatedApp };

type SocketServerOptions = {
  API: Record<string, Function>;
  authentication: (token: string) => Promise<boolean>;
};

class SocketServer {
  private app: TemplatedApp;
  events = new EventEmitter();

  constructor(private options: SocketServerOptions) {
    this.app = App();

    this.app.ws("/", {
      open: (ws) => {
        (ws as WebSocket).id = randomUUID();
        const rpc: PromisifiedClientAPI = new Proxy(
          {} as PromisifiedClientAPI,
          {
            get: (_target, event) => {
              return (...args: any[]) => {
                ws.send(JSON.stringify({ event: event.toString(), args }));
              };
            },
            set: () => false,
          },
        );

        (ws as WebSocket).client = rpc;
        this.events.emit("open", ws);
      },
      close: (ws, code, message) => {
        this.events.emit("close", {
          ws,
          code,
          message: Buffer.from(message).toString(),
        });
      },
      message: async (ws, message) => {
        const msg = JSON.parse(Buffer.from(message).toString());

        try {
          const response = await this.options.API[msg.event](
            { socket: ws, app: this.app },
            ...msg.args,
          );
          ws.send(JSON.stringify({ id: `${msg.id}-resolve`, response }));
        } catch (error) {
          ws.send(
            JSON.stringify({
              id: `${msg.id}-reject`,
              response: (error as Error).message,
            }),
          );
        }
        this.events.emit("message", { ws, message });
      },
      upgrade: async (res, req, context) => {
        const token = req.getHeader("authorization");
        const authenticated = await this.options.authentication(token);
        if (!authenticated) {
          res.close();
          return;
        }

        this.events.emit("authenticated", { token });

        res.upgrade(
          {
            url: req.getUrl(),
            origin: req.getHeader("origin"),
            protocol: req.getHeader("sec-websocket-protocol"),
            accept: req.getHeader("sec-websocket-key"),
            token,
          },
          req.getHeader("sec-websocket-key"),
          req.getHeader("sec-websocket-protocol"),
          req.getHeader("sec-websocket-extensions"),
          context,
        );
      },
    });
  }

  listen(port: number, cb?: () => void) {
    this.app.listen(port, (listenSocket) => {
      if (listenSocket) {
        cb?.();
      }
    });
  }
}

export default SocketServer;
