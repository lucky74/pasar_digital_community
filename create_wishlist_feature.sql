-- Create Wishlist Table
-- Note: product_id must be BIGINT to match products.id type
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlists;
CREATE POLICY "Users can view their own wishlist" ON wishlists
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their own wishlist" ON wishlists;
CREATE POLICY "Users can add to their own wishlist" ON wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON wishlists;
CREATE POLICY "Users can remove from their own wishlist" ON wishlists
    FOR DELETE USING (auth.uid() = user_id);
