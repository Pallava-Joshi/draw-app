-- CreateTable
CREATE TABLE "ShapeMovement" (
    "shapeId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "shapeData" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShapeMovement_pkey" PRIMARY KEY ("shapeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShapeMovement_shapeId_roomId_key" ON "ShapeMovement"("shapeId", "roomId");

-- AddForeignKey
ALTER TABLE "ShapeMovement" ADD CONSTRAINT "ShapeMovement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShapeMovement" ADD CONSTRAINT "ShapeMovement_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
