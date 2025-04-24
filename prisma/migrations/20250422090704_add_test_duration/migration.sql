/*
  Warnings:

  - You are about to drop the column `difficultyId` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the `Difficulty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Difficulty` DROP FOREIGN KEY `Difficulty_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `Difficulty` DROP FOREIGN KEY `Difficulty_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `Test` DROP FOREIGN KEY `Test_difficultyId_fkey`;

-- AlterTable
ALTER TABLE `Test` DROP COLUMN `difficultyId`,
    ADD COLUMN `difficulty` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL DEFAULT 'BEGINNER',
    ADD COLUMN `duration` INTEGER NOT NULL DEFAULT 30;

-- DropTable
DROP TABLE `Difficulty`;
