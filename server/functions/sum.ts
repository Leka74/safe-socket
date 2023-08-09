import { Context } from "../socket";

export default function(_ctx: Context, a: number, b: number) {
  if (typeof a !== "number" || typeof b !== "number")
    throw new Error("parameters must be numbers");

  return a + b;
}
