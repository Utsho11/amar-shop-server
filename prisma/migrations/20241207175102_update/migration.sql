/*
  Warnings:

  - You are about to drop the column `image` on the `admins` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "discountPercent" SET DATA TYPE TEXT;
