-- RenameEnum
ALTER TYPE "NewsletterStatus" RENAME TO "CommunicationStatus";
ALTER TYPE "NewsletterTarget" RENAME TO "CommunicationTarget";
ALTER TYPE "NewsletterType" RENAME TO "CommunicationType";

-- RenameTable
ALTER TABLE "Newsletter" RENAME TO "Communication";
ALTER TABLE "AnnouncementRead" RENAME TO "CommunicationRead";

-- RenameColumn
ALTER TABLE "CommunicationRead" RENAME COLUMN "newsletterId" TO "communicationId";

-- RenameConstraint
ALTER TABLE "Communication" RENAME CONSTRAINT "Newsletter_pkey" TO "Communication_pkey";
ALTER TABLE "Communication" RENAME CONSTRAINT "Newsletter_sectionId_fkey" TO "Communication_sectionId_fkey";
ALTER TABLE "CommunicationRead" RENAME CONSTRAINT "AnnouncementRead_pkey" TO "CommunicationRead_pkey";
ALTER TABLE "CommunicationRead" RENAME CONSTRAINT "AnnouncementRead_newsletterId_fkey" TO "CommunicationRead_communicationId_fkey";
ALTER TABLE "CommunicationRead" RENAME CONSTRAINT "AnnouncementRead_parentId_fkey" TO "CommunicationRead_parentId_fkey";

-- RenameIndex
ALTER INDEX "AnnouncementRead_newsletterId_parentId_key" RENAME TO "CommunicationRead_communicationId_parentId_key";
