import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { ButtonComponent, Discord } from "discordx";
import { prisma } from "../main.js";

@Discord()
export class ButtonsListener {
  @ButtonComponent({
    id: "enter_giveaway",
  })
  async enterGiveaway(interaction: ButtonInteraction) {
    const giveaway = await prisma.giveaway.findUnique({
      where: {
        guildId_channelId_messageId: {
          guildId: interaction.guildId!,
          channelId: interaction.channelId!,
          messageId: interaction.message.id,
        },
      },
      include: {
        members: {
          where: {
            userId: interaction.user.id,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!giveaway) {
      return interaction.reply({
        content: "This giveaway does not exist or is already over",
        ephemeral: true,
      });
    }

    if (giveaway.members.length) {
      return interaction.reply({
        content: "You have already entered this giveaway",
        ephemeral: true,
      });
    }

    await prisma.member.create({
      data: {
        userId: interaction.user.id,
        giveawayId: giveaway.id,
      },
    });

    await interaction.reply({
      content: "You have entered the giveaway",
      ephemeral: true,
    });

    const embed = interaction.message.embeds[0];
    embed.fields[0].value = `${giveaway._count.members + 1}`;

    await interaction.message.edit({
      embeds: [embed],
    });
  }
}
