import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client, IntentsBitField, MessageFlags } from "discord.js";
import { CreateTicket } from "./ticket.js";

dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const filePath = path.join(process.cwd(), "data", "tickets.json");

client.once("clientReady", (bot) => {
  console.log(`Bot '${bot.user.username}' is online`);
});

client.login(process.env.TOKEN);

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  let tickets;
  try {
    tickets = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    tickets = {};
  }

  if (msg.content.toLowerCase().startsWith("!ticket")) {
    const userId = msg.author.id;
    const existing = tickets[userId];

    if (existing && existing.status === "open") {
      if (existing.channelId === msg.channel.id) {
        await msg.reply("You already have this ticket open.");
      } else {
        await msg.reply(
          `You already have a ticket open in <#${existing.channelId}>.`
        );
      }
      return;
    }

    await CreateTicket(msg);
    return;
  }

  const inTicket = Object.values(tickets).some(
    (ticket) => ticket.channelId === msg.channel.id
  );

  if (inTicket) {
    console.log(`Message in ticket channel: ${msg.content}`);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  let tickets;
  try {
    tickets = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    tickets = {};
  }

  if (interaction.commandName === "ticket") {
    const userId = interaction.user.id;
    const existing = tickets[userId];

    if (existing && existing.status === "open") {
      await interaction.reply({
        content: `You already have a ticket open in <#${existing.channelId}>.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await CreateTicket(interaction);
  }
});
