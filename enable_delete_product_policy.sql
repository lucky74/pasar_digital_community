-- Policy to allow users to delete their own products based on username in 'seller' column
-- Assumes 'products' table has a 'seller' column storing the username
-- Assumes 'profiles' table links auth.uid() to 'username'

create policy "Users can delete their own products"
on "public"."products"
for delete
to authenticated
using (
  seller in (
    select username from profiles where id = auth.uid()
  )
);
