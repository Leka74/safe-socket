import bye from "./functions/bye";
import hello from "./functions/hello";
import Socket from "./socket";

export const API = {
  hello,
  bye,
};

const ws = new Socket("ws://localhost:4000", {
  API,
  token: "thisissecrettoken",
});

const { server } = ws;

ws.events.on("open", async () => {
  console.log("Connected to the server");

  const res = await server.hello("John", "Doe");
  console.log(res); // outputs: [<uuid>] hello John Doe

  server.sum(1, 2).then((total) => {
    console.log("Sum of 1 + 2 is", total); // outputs: 3
  });

  // @ts-ignore
  server.sum(1, "text").catch(console.error); // outputs: Parameters must be numbers
});

ws.events.on("close", () => {
  console.log("Disconnected from the server");
});

ws.connect();
