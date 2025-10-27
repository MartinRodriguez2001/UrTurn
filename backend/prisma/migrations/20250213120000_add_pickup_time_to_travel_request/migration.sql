-- Add pickup_time column to TravelRequest table if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'TravelRequest'
          AND column_name = 'pickup_time'
    ) THEN
        ALTER TABLE "TravelRequest"
        ADD COLUMN "pickup_time" TIMESTAMP(3);
    END IF;
END $$;
