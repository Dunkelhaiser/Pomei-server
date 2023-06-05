-- CreateTable
CREATE TABLE "ResetPasswordEmail" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ResetPasswordEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResetPasswordEmail_token_key" ON "ResetPasswordEmail"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ResetPasswordEmail_userId_key" ON "ResetPasswordEmail"("userId");

-- AddForeignKey
ALTER TABLE "ResetPasswordEmail" ADD CONSTRAINT "ResetPasswordEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
