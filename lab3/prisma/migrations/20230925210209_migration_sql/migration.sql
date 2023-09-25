/*
  Warnings:

  - The primary key for the `Page` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `page_id` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `visited_at` on the `Page` table. All the data in the column will be lost.
  - Added the required column `id` to the `Page` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "_incoming" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_incoming_A_fkey" FOREIGN KEY ("A") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_incoming_B_fkey" FOREIGN KEY ("B") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Page" ("url") SELECT "url" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_url_key" ON "Page"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_incoming_AB_unique" ON "_incoming"("A", "B");

-- CreateIndex
CREATE INDEX "_incoming_B_index" ON "_incoming"("B");
