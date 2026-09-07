import { Composer } from "grammy";
import type { Context } from "../bot.ts";

export const chatComposer = new Composer<Context>();

chatComposer.on("message", async (ctx, next) => {
	await ctx.database
		.insertInto("chats")
		.values({ id: ctx.chat.id })
		.onConflict((conflict) => conflict.column("id").doNothing())
		.execute();

	await next();
});
