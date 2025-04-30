-- AlterTable
ALTER TABLE `User` ADD COLUMN `marketingEmails` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `termsAccepted` BOOLEAN NOT NULL DEFAULT false;
