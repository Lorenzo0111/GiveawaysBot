import { bot, prisma } from "../main.js";
import { Giveaway, Member } from "@prisma/client";

export class GiveawayHandler {
  init() {
    this.checkGiveaways();
    setInterval(this.checkGiveaways.bind(this), 1000 * 60 * 5);
  }

  async checkGiveaways() {
    const giveaways = await prisma.giveaway.findMany({
      where: {
        endAt: {
          lte: new Date(),
        },
      },
      include: {
        members: true,
      },
    });

    for (const giveaway of giveaways) {
      await this.extractGiveaway(giveaway);
    }
  }

  async extractGiveaway(giveaway: Giveaway & { members: Member[] }) {
    if (!giveaway.members.length) return;

    const winners = this.extractWinners(giveaway.members, giveaway.winners);

    const guild = await bot.guilds.fetch(giveaway.guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    if (!channel || !channel.isTextBased()) return;

    const message = await channel.messages.fetch(giveaway.messageId);
    if (!message) return;

    await message.reply({
      content: `Congratulations ${winners.map((winner) => "<@" + winner.userId + ">").join(", ")} for winning the giveaway!`,
    });

    await prisma.giveaway.delete({
      where: {
        id: giveaway.id,
      },
    });
  }

  private extractWinners(members: Member[], count: number) {
    const winners = members.sort(() => Math.random() - 0.5).slice(0, count);

    return winners;
  }
}
