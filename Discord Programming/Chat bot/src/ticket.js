import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PermissionsBitField, MessageFlags } from "discord.js";

dotenv.config();

const filePath = path.join(process.cwd(), "data", "tickets.json");
const dir = path.dirname(filePath);

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");

let tickets = JSON.parse(fs.readFileSync(filePath, "utf-8"));

export async function CreateTicket(input) {
  console.log("Ticket Request.........");

  // Message or Interaction
  const isInteraction = input.isChatInputCommand && input.isChatInputCommand();
  const user = isInteraction ? input.user : input.author;
  const guild = input.guild;

  // Check for existing open ticket
  if (tickets[user.id] && tickets[user.id].status === "open") {
    const message = `You already have a ticket open in <#${
      tickets[user.id].channelId
    }>.`;
    return isInteraction
      ? input.reply({ content: message, flags: MessageFlags.Ephemeral })
      : input.reply(message);
  }

  // Create the channel
  const Channel = await guild.channels.create({
    name: `ticket-${user.username}`,
    type: 0,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
      {
        id: process.env.ADMIN_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
    ],
  });

  // Save data
  tickets[user.id] = {
    channelId: Channel.id,
    status: "open",
  };
  fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2));

  // Respond to user
  const successMsg = `Ticket created: <#${Channel.id}>`;
  await Channel.send(
    `Hello <@${user.id}>, please describe your issue here`
  );

  if (isInteraction)
    await input.reply({ content: successMsg, flags: MessageFlags.Ephemeral });
  else input.reply(successMsg);
}
