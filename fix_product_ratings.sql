-- FIX PRODUCT RATINGS DISPLAY
-- Run this in Supabase SQL Editor to sync ratings to the main menu

-- 1. Add columns to products table (if they don't exist)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 2. Backfill/Recalculate existing data for all products
-- This ensures products that already have reviews get updated immediately
UPDATE products p
SET 
    rating = COALESCE((SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id), 0),
    review_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id), 0);

-- 3. Create Function to auto-update rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE products
        SET 
            rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = OLD.product_id), 0),
            review_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id), 0)
        WHERE id = OLD.product_id;
        RETURN OLD;
    ELSE
        UPDATE products
        SET 
            rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = NEW.product_id), 0),
            review_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id), 0)
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger to watch the 'reviews' table
DROP TRIGGER IF EXISTS on_review_change ON reviews;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();
