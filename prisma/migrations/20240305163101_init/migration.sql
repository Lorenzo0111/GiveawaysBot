-- CreateTable
CREATE TABLE "Giveaway" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,
    "winners" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Giveaway_guildId_channelId_messageId_key" ON "Giveaway"("guildId", "channelId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_giveawayId_userId_key" ON "Member"("giveawayId", "userId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
