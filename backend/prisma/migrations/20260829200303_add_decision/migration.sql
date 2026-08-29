-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('Draft', 'UnderReview', 'Rejected', 'Approved', 'Archived');

-- CreateTable
CREATE TABLE "Decision" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'Draft',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
