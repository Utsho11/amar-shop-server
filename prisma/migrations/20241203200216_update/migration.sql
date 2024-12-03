/*
  Warnings:

  - You are about to drop the column `role` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "role",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "role",
DROP COLUMN "status";
