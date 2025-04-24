/*
  Warnings:

  - You are about to drop the `TestAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `TestAnswer` DROP FOREIGN KEY `TestAnswer_optionId_fkey`;

-- DropForeignKey
ALTER TABLE `TestAnswer` DROP FOREIGN KEY `TestAnswer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `TestAnswer` DROP FOREIGN KEY `TestAnswer_testResultId_fkey`;

-- DropForeignKey
ALTER TABLE `TestResult` DROP FOREIGN KEY `TestResult_testId_fkey`;

-- DropForeignKey
ALTER TABLE `TestResult` DROP FOREIGN KEY `TestResult_userId_fkey`;

-- DropTable
DROP TABLE `TestAnswer`;

-- DropTable
DROP TABLE `TestResult`;
