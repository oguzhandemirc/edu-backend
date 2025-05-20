/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Test` table. All the data in the column will be lost.
  - Added the required column `difficultyLevelId` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- Önce sadece shadow veritabanında kullanmak üzere bir admin kullanıcısı oluşturalım
CREATE TABLE IF NOT EXISTS `User` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `googleId` VARCHAR(191) NULL,
  `profilePhoto` VARCHAR(191) NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'user',
  `termsAccepted` BOOLEAN NOT NULL DEFAULT false,
  `marketingEmails` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `User_email_key`(`email`),
  UNIQUE INDEX `User_googleId_key`(`googleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Admin kullanıcısı ekle (sadece migration için)
INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `createdAt`, `updatedAt`, `termsAccepted`)
VALUES (1, 'admin@example.com', 'hashedpassword', 'Admin', 'admin', NOW(), NOW(), true)
ON DUPLICATE KEY UPDATE id=id;

-- DifficultyLevel tablosunu oluştur
CREATE TABLE `DifficultyLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `value` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `DifficultyLevel_name_key`(`name`),
    INDEX `DifficultyLevel_createdById_idx`(`createdById`),
    INDEX `DifficultyLevel_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DifficultyLevel` ADD CONSTRAINT `DifficultyLevel_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DifficultyLevel` ADD CONSTRAINT `DifficultyLevel_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Varsayılan zorluk seviyelerini ekle (Admin kullanıcısının ID'si 1 olduğunu varsayarak)
INSERT INTO `DifficultyLevel` (`name`, `description`, `value`, `createdAt`, `updatedAt`, `createdById`)
VALUES 
('Başlangıç', 'Başlangıç seviyesi testler', 1, NOW(), NOW(), 1),
('Orta', 'Orta seviye testler', 2, NOW(), NOW(), 1),
('İleri', 'İleri seviye testler', 3, NOW(), NOW(), 1),
('Uzman', 'Uzman seviye testler', 4, NOW(), NOW(), 1);

-- Mevcut testlerin zorluk seviyelerini düzenle
-- Önce "difficultyLevelId" sütununu ekle
ALTER TABLE `Test` ADD COLUMN `difficultyLevelId` INTEGER NULL;

-- Difficulty değerlerini yeni DifficultyLevel ID'leri ile güncelle
UPDATE `Test` SET `difficultyLevelId` = 1 WHERE `difficulty` = 'BEGINNER';
UPDATE `Test` SET `difficultyLevelId` = 2 WHERE `difficulty` = 'INTERMEDIATE';
UPDATE `Test` SET `difficultyLevelId` = 3 WHERE `difficulty` = 'ADVANCED';
UPDATE `Test` SET `difficultyLevelId` = 4 WHERE `difficulty` = 'EXPERT';

-- Şimdi difficultyLevelId sütununu NOT NULL yap
ALTER TABLE `Test` MODIFY COLUMN `difficultyLevelId` INTEGER NOT NULL;

-- "difficulty" sütununu kaldır
ALTER TABLE `Test` DROP COLUMN `difficulty`;

-- CreateIndex
CREATE INDEX `Test_difficultyLevelId_idx` ON `Test`(`difficultyLevelId`);

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_difficultyLevelId_fkey` FOREIGN KEY (`difficultyLevelId`) REFERENCES `DifficultyLevel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Test` RENAME INDEX `Test_createdById_fkey` TO `Test_createdById_idx`;

-- RenameIndex
ALTER TABLE `Test` RENAME INDEX `Test_sectionId_fkey` TO `Test_sectionId_idx`;

-- RenameIndex
ALTER TABLE `Test` RENAME INDEX `Test_updatedById_fkey` TO `Test_updatedById_idx`;
