import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import ms from "ms";
import { handler, prisma } from "../main.js";

@Discord()
@SlashGroup({
  name: "giveaways",
  description: "Manage all the giveaways",
})
@SlashGroup("giveaways")
export class GiveawaysCommand {
  @Slash({
    name: "create",
    description: "Create a new giveaway",
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
  })
  async create(
    @SlashOption({
      name: "name",
      description: "The name of the giveaway",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    name: string,
    @SlashOption({
      name: "duration",
      description: "The duration of the giveaway",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    duration: string,
    @SlashOption({
      name: "winners",
      description: "The number of winners",
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    winners: number,
    interaction: CommandInteraction
  ) {
    const durationMs = ms(duration);
    if (!durationMs) {
      return interaction.reply({
        content: "Invalid duration",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription("Click the button below to enter the giveaway!")
      .setColor(Colors.Blurple)
      .setFields({
        name: "Entries",
        value: "0",
      })
      .setTimestamp(Date.now() + durationMs)
      .setFooter({ text: "Ends at" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("enter_giveaway")
        .setLabel("Enter")
        .setStyle(ButtonStyle.Primary)
    );

    const message = await interaction.channel?.send({
      embeds: [embed],
      components: [row],
    });

    if (!message) {
      return interaction.reply({
        content: "Failed to create the giveaway",
        ephemeral: true,
      });
    }

    await prisma.giveaway.create({
      data: {
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        messageId: message.id,
        endAt: new Date(Date.now() + durationMs),
        winners,
        name,
      },
    });

    interaction.reply({
      content: "Giveaway created",
      ephemeral: true,
    });
  }

  @Slash({
    name: "list",
    description: "List all the giveaways",
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
  })
  async list(interaction: CommandInteraction) {
    const giveaways = await prisma.giveaway.findMany({
      where: {
        guildId: interaction.guildId!,
      },
    });

    if (!giveaways.length) {
      return interaction.reply({
        content: "No giveaways found",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Giveaways")
      .setColor(Colors.Blurple)
      .setDescription(
        giveaways
          .map(
            (giveaway) =>
              `**${giveaway.name}** - <t:${Math.floor(
                giveaway.endAt.getTime() / 1000
              )}:R>`
          )
          .join("\n")
      );

    interaction.reply({ embeds: [embed] });
  }

  @Slash({
    name: "end",
    description: "End a giveaway",
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
  })
  async end(
    @SlashOption({
      name: "giveaway",
      description: "The id of the message of the giveaway to end",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    id: string,
    @SlashOption({
      name: "force",
      description: "Force end the giveaway",
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    force = false,
    interaction: CommandInteraction
  ) {
    const giveaway = await prisma.giveaway.findFirst({
      where: {
        guildId: interaction.guildId!,
        messageId: id,
      },
      include: {
        members: true,
      },
    });

    if (!giveaway) {
      return interaction.reply({
        content: "Giveaway not found",
        ephemeral: true,
      });
    }

    if (force) {
      const message = await interaction.channel?.messages.fetch(
        giveaway.messageId
      );
      if (message) {
        await message.delete();
      }

      await prisma.giveaway.delete({
        where: {
          id: giveaway.id,
        },
      });
    } else {
      await handler.extractGiveaway(giveaway);
    }

    interaction.reply({
      content: "Giveaway ended",
      ephemeral: true,
    });
  }
}
