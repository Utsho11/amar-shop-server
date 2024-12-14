/*
  Warnings:

  - You are about to drop the column `productId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_productId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "productId";
