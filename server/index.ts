import hello from "./functions/hello";
import sum from "./functions/sum";
import SocketServer, { WebSocket } from "./socket";

export const API = {
  /** Greets name and surname with a hello and adds the user id in the beginning of string */
  hello,
  /** Adds two numbers together and returns the output */
  sum,
};

const server = new SocketServer({
  authentication: (token) => {
    return Promise.resolve(token === "thisissecrettoken");
  },
  API,
});

server.events.on("open", ({ id, client }: WebSocket) => {
  console.log(`User ${id} connected`);

  client.hello("John");
  client.bye("Doe");
});

server.events.on("close", ({ ws, code }) => {
  console.log(`User ${ws.id} disconnected with code ${code}`);
});

server.listen(4000, () => {
  console.log("Listening on port 4000");
});
