/*
  Warnings:

  - Added the required column `createdById` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Question` ADD COLUMN `createdById` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Section` ADD COLUMN `createdById` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Test` ADD COLUMN `createdById` INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Yeni eklenen alanlar için default değeri kaldır (yeni eklenecek kayıtlarda varsayılan değer kullanılmaması için)
ALTER TABLE `Question` ALTER COLUMN `createdById` DROP DEFAULT;
ALTER TABLE `Section` ALTER COLUMN `createdById` DROP DEFAULT;
ALTER TABLE `Test` ALTER COLUMN `createdById` DROP DEFAULT;
