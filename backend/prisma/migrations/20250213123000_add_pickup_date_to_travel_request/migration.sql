-- Add pickup_date column to TravelRequest table if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'TravelRequest'
          AND column_name = 'pickup_date'
    ) THEN
        ALTER TABLE "TravelRequest"
        ADD COLUMN "pickup_date" TIMESTAMP(3);
    END IF;
END $$;
