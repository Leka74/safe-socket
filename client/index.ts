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

ws.events.on("open", () => {
  console.log("Connected to the server");
  ws.rpc.sum(1, 2).then((total) => {
    console.log("Sum of 1 + 2 is", total); // outputs: 3
  });
  // @ts-ignore
  ws.rpc.sum(1, "text").catch(console.error); // outputs: Parameters must be numbers
});

ws.events.on("close", () => {
  console.log("Disconnected from the server");
});

ws.connect();
