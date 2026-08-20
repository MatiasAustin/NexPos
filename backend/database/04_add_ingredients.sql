-- NexPos DB Migration: Add Ingredients to Products

ALTER TABLE products 
ADD COLUMN ingredients JSONB DEFAULT '[]'::jsonb;
