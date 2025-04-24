-- AlterTable
ALTER TABLE `Question` ADD COLUMN `updatedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `Section` ADD COLUMN `updatedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `Test` ADD COLUMN `updatedById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
