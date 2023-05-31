-- CreateIndex
CREATE INDEX "folderTitle" ON "Folder"("title");

-- CreateIndex
CREATE INDEX "noteTitle" ON "Note"("title");

-- CreateIndex
CREATE INDEX "username" ON "User"("username");

-- CreateIndex
CREATE INDEX "email" ON "User"("email");
