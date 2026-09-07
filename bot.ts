import { Bot, type Context, InputFile } from "npm:grammy@1.46.0";
import {
  openTelemetry,
  type OpenTelemetryContext,
  type SpanDefinitions,
} from "npm:@grammyjs/opentelemetry@0.1.1";
import { DiagLogLevel } from "npm:@opentelemetry/api@1.9.1";

type BotEvents = {
  voice_send: {
    event_type: "voice_send";
    chat_type: "private" | "group" | "channel" | "unknown";
    mode: "inline" | "guest";
  };
};
type BotContext = Context & OpenTelemetryContext<SpanDefinitions, BotEvents>;

function chatType(
  type: string | undefined,
): BotEvents["voice_send"]["chat_type"] {
  if (type === "private" || type === "sender") return "private";
  if (type === "group" || type === "supergroup") return "group";
  if (type === "channel") return "channel";
  return "unknown";
}

// Enable Inline Mode and Guest Mode in @BotFather.
// Put BOT_TOKEN in .env, then upload once to a chat that has started the bot:
// deno run --no-lock --env-file=.env --allow-env --allow-net --allow-read --allow-sys bot.ts --upload CHAT_ID
// Put the printed VOICE_FILE_ID in .env (it belongs to this bot), then run:
// deno run --no-lock --env-file=.env --allow-env --allow-net --allow-read --allow-sys bot.ts

const voicePath = new URL("./oh-yeah.ogg", import.meta.url);

const token = Deno.env.get("BOT_TOKEN");
if (!token) throw new Error("Set BOT_TOKEN in .env.");
const bot = new Bot<BotContext>(token);

if (Deno.args[0] === "--upload") {
  const chatId = Deno.args[1];
  if (!chatId || Deno.args.length !== 2) {
    throw new Error(
      "Usage: bot.ts --upload CHAT_ID (start the bot in that chat first)",
    );
  }
  const message = await bot.api.sendVoice(
    chatId,
    new InputFile(await Deno.readFile(voicePath), "oh-yeah.ogg"),
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
    id: "oh-yeah",
    voice_file_id: fileId,
    title: "Oh yeah",
  };
  const { telemetryMiddleware, telemetryTransformer } = openTelemetry<
    SpanDefinitions,
    BotEvents
  >("ouhyesbot", { logLevel: DiagLogLevel.WARN });
  bot.api.config.use(telemetryTransformer);
  bot.use(telemetryMiddleware);

  // Inline events count successful result answers, not confirmed user sends.
  // Disable result caching so Telegram asks the bot for each query.
  bot.on("inline_query", async (ctx) => {
    await ctx.answerInlineQuery([voice], { cache_time: 0 });
    ctx.telemetry.event("voice_send", {
      event_type: "voice_send",
      chat_type: chatType(ctx.inlineQuery.chat_type),
      mode: "inline",
    });
  });
  bot.on(
    "guest_message:guest_query_id",
    async (ctx) => {
      await ctx.api.answerGuestQuery(ctx.guestMessage.guest_query_id, voice);
      ctx.telemetry.event("voice_send", {
        event_type: "voice_send",
        chat_type: chatType(ctx.guestMessage.chat.type),
        mode: "guest",
      });
    },
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
