import { dirname, importx } from "@discordx/importer";
import { PrismaClient } from "@prisma/client";
import type { Interaction, Message } from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import { GiveawayHandler } from "./managers/handler.js";

import "dotenv/config";

export const prisma = new PrismaClient();
export const handler = new GiveawayHandler();
export const bot = new Client({
  intents: [IntentsBitField.Flags.Guilds],
  silent: true,
});

bot.once("ready", async () => {
  await bot.initApplicationCommands();
  console.log("Bot started");
});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", async (message: Message) => {
  await bot.executeCommand(message);
});

async function run() {
  await importx(
    `${dirname(import.meta.url)}/{events,commands,interactions}/**/*.{ts,js}`
  );

  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }

  await bot.login(process.env.BOT_TOKEN);
  handler.init();
}

void run();
