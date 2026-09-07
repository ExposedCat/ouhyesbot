import { Bot, InputFile } from "jsr:@grammyjs/grammy@2.0.0-beta.8";

// Enable Inline Mode and Guest Mode in @BotFather.
// Put BOT_TOKEN in .env, then upload once to a chat that has started the bot:
// deno run --no-lock --env-file=.env --allow-env --allow-net bot.ts --upload CHAT_ID
// Put the printed VOICE_FILE_ID in .env (it belongs to this bot), then run:
// deno run --no-lock --env-file=.env --allow-env --allow-net bot.ts

// oh_yes.wav converted to OGG/Opus, embedded to keep the bot self-contained.
const VOICE_BASE64 =
  "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";

const token = Deno.env.get("BOT_TOKEN");
if (!token) throw new Error("Set BOT_TOKEN in .env.");
const bot = new Bot(token);

if (Deno.args[0] === "--upload") {
  const chatId = Deno.args[1];
  if (!chatId || Deno.args.length !== 2) {
    throw new Error(
      "Usage: bot.ts --upload CHAT_ID (start the bot in that chat first)",
    );
  }
  const bytes = Uint8Array.from(atob(VOICE_BASE64), (c) => c.charCodeAt(0));
  const message = await bot.api.sendVoice(
    chatId,
    new InputFile(bytes, "oh_yes.ogg"),
  );
  if (!message.voice) {
    throw new Error("Telegram did not return a voice message.");
  }
  console.log(`VOICE_FILE_ID=${message.voice.file_id}`);
} else {
  if (Deno.args.length) throw new Error("Usage: bot.ts [--upload CHAT_ID]");
  const fileId = Deno.env.get("VOICE_FILE_ID");
  if (!fileId) {
    throw new Error(
      "Run bot.ts --upload CHAT_ID, then set VOICE_FILE_ID in .env.",
    );
  }

  const voice = {
    type: "voice" as const,
    id: "oh-yes",
    voice_file_id: fileId,
    title: "Oh yes",
  };
  bot.on("inline_query", (ctx) => ctx.answerInlineQuery([voice]));
  bot.on(
    "guest_message:guest_query_id",
    (ctx) => ctx.api.answerGuestQuery(ctx.guestMessage.guest_query_id, voice),
  );
  bot.catch((err) => console.error("Failed to answer query:", err.error));

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    Deno.addSignalListener(signal, () => {
      void bot.stop();
    });
  }
  await bot.start({
    allowed_updates: ["inline_query", "guest_message"],
    onStart: (me) =>
      console.log(`@${me.username} is listening for inline and guest queries.`),
  });
}
