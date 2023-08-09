import { Context } from "../socket";

export default function(ctx: Context, name: string, surname: string) {
  const { id } = ctx.socket;

  return `[${id}] hello ${name} ${surname}`;
}
