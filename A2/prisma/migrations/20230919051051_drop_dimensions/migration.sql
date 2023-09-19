/*
  Warnings:

  - You are about to drop the `Dimensions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dimension_x` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dimension_y` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dimension_z` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Dimensions";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "product_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "dimension_x" REAL NOT NULL,
    "dimension_y" REAL NOT NULL,
    "dimension_z" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("created_at", "name", "price", "product_id", "stock", "updated_at") SELECT "created_at", "name", "price", "product_id", "stock", "updated_at" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
