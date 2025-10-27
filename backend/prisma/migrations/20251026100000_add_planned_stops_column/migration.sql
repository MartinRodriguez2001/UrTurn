-- Add planned_stops column to store ordered stops for each travel
ALTER TABLE "Travel"
ADD COLUMN "planned_stops" JSONB;
