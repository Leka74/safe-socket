import { Context } from "../socket";

export default function(ctx: Context, name: string, surname: string) {
  const { id } = ctx.socket.getUserData();

  return `[${id}] hello ${name} ${surname}`;
}
