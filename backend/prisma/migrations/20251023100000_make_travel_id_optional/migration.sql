-- Allow TravelRequest entries without an assigned travel
ALTER TABLE "TravelRequest"
ALTER COLUMN "travelId" DROP NOT NULL;
