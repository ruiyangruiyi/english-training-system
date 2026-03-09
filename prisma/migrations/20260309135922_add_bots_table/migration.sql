-- CreateTable
CREATE TABLE "Bot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wechat_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "group_count" INTEGER NOT NULL DEFAULT 0,
    "max_groups" INTEGER NOT NULL DEFAULT 50,
    "server_ip" TEXT,
    "last_heartbeat" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Class" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "wechat_group_id" TEXT,
    "wechat_group_name" TEXT,
    "teacher_id" INTEGER,
    "bot_id" INTEGER,
    CONSTRAINT "Class_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Class_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "Bot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("grade", "id", "name", "schedule", "teacher_id", "wechat_group_id", "wechat_group_name") SELECT "grade", "id", "name", "schedule", "teacher_id", "wechat_group_id", "wechat_group_name" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Bot_wechat_id_key" ON "Bot"("wechat_id");
