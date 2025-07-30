-- Add postcode column to bag_collections table
ALTER TABLE public.bag_collections 
ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Create index for faster postcode searches
CREATE INDEX IF NOT EXISTS idx_bag_collections_postcode 
ON public.bag_collections(postcode);

-- Update existing records with a default postcode if needed
-- UPDATE public.bag_collections 
-- SET postcode = 'UNKNOWN' 
-- WHERE postcode IS NULL;
