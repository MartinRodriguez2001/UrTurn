-- CreateEnum
CREATE TYPE "TravelStatus" AS ENUM ('pendiente', 'confirmado', 'cancelado', 'finalizado');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('abierto', 'en_revision', 'resuelto');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "institutional_email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "institution_credential" TEXT NOT NULL,
    "student_certificate" TEXT NOT NULL,
    "IsDriver" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "profile_picture" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Travel" (
    "id" SERIAL NOT NULL,
    "start_location_name" TEXT,
    "start_latitude" DOUBLE PRECISION NOT NULL,
    "start_longitude" DOUBLE PRECISION NOT NULL,
    "end_location_name" TEXT,
    "end_latitude" DOUBLE PRECISION NOT NULL,
    "end_longitude" DOUBLE PRECISION NOT NULL,
    "current_latitude" DOUBLE PRECISION,
    "current_longitude" DOUBLE PRECISION,
    "last_position_at" TIMESTAMP(3),
    "route_waypoints" JSONB,
    "planned_stops" JSONB,
    "capacity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "travel_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "spaces_available" INTEGER NOT NULL,
    "status" "TravelStatus" NOT NULL DEFAULT 'pendiente',
    "carId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Travel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "licence_plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "validation" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "user_target_id" INTEGER NOT NULL,
    "travel_id" INTEGER NOT NULL,
    "starts" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" SERIAL NOT NULL,
    "travelId" INTEGER,
    "start_location_name" TEXT,
    "start_latitude" DOUBLE PRECISION NOT NULL,
    "start_longitude" DOUBLE PRECISION NOT NULL,
    "end_location_name" TEXT,
    "end_latitude" DOUBLE PRECISION NOT NULL,
    "end_longitude" DOUBLE PRECISION NOT NULL,
    "pickup_date" TIMESTAMP(3),
    "pickup_time" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'pendiente',
    "passengerId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confirmation" (
    "id" SERIAL NOT NULL,
    "travelId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "travelId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelLocation" (
    "id" SERIAL NOT NULL,
    "travelId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_institutional_email_key" ON "User"("institutional_email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licence_plate_key" ON "Vehicle"("licence_plate");

-- CreateIndex
CREATE INDEX "TravelLocation_travelId_recordedAt_idx" ON "TravelLocation"("travelId", "recordedAt");

-- CreateIndex
CREATE INDEX "TravelLocation_driverId_recordedAt_idx" ON "TravelLocation"("driverId", "recordedAt");

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travel" ADD CONSTRAINT "Travel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_target_id_fkey" FOREIGN KEY ("user_target_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_travel_id_fkey" FOREIGN KEY ("travel_id") REFERENCES "Travel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelLocation" ADD CONSTRAINT "TravelLocation_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "Travel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelLocation" ADD CONSTRAINT "TravelLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
