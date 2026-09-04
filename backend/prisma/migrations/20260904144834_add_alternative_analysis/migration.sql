-- CreateTable
CREATE TABLE "Alternative" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "cost" TEXT NOT NULL,
    "feasibility" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "decisionId" INTEGER NOT NULL,

    CONSTRAINT "Alternative_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
