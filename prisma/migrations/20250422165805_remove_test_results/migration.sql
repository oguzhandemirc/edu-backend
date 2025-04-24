/*
  Warnings:

  - You are about to drop the `UserAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTestResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserAnswer` DROP FOREIGN KEY `UserAnswer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `UserAnswer` DROP FOREIGN KEY `UserAnswer_selectedOptionId_fkey`;

-- DropForeignKey
ALTER TABLE `UserAnswer` DROP FOREIGN KEY `UserAnswer_userTestResultId_fkey`;

-- DropForeignKey
ALTER TABLE `UserTestResult` DROP FOREIGN KEY `UserTestResult_testId_fkey`;

-- DropForeignKey
ALTER TABLE `UserTestResult` DROP FOREIGN KEY `UserTestResult_userId_fkey`;

-- DropTable
DROP TABLE `UserAnswer`;

-- DropTable
DROP TABLE `UserTestResult`;
