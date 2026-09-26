-- ==============================================================================
-- Supabase PostgreSQL Schema for E-Commerce Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0)
);

-- 5. CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read & update only their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Products: Everyone can read products; only service role / admin can modify
CREATE POLICY "Public products read access" 
  ON public.products FOR SELECT 
  TO PUBLIC 
  USING (true);

-- Cart Items: Users can only manage their own cart
CREATE POLICY "Users can view own cart items" 
  ON public.cart_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items" 
  ON public.cart_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items" 
  ON public.cart_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" 
  ON public.cart_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Orders: Users can read and create their own orders
CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view order items for their own orders
CREATE POLICY "Users can view own order items" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items into own orders" 
  ON public.order_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- Sample Products Seed Data
-- ==============================================================================
INSERT INTO public.products (name, description, price, image_url, category, stock_quantity)
VALUES 
  ('NovaPulse Wireless Noise-Cancelling Headphones', 'Hybrid active noise cancellation, custom 40mm drivers, and 45-hour battery life.', 249.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'audio', 25),
  ('AeroTitan Ultra Smartwatch Series X', 'Aerospace titanium casing, sapphire crystal AMOLED display, ECG and SpO2 tracking.', 319.50, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'wearables', 18),
  ('LuminaView 4K Creator Ultra-Wide Monitor 34"', 'Curved 3440 x 1440 Nano-IPS panel, 98% DCI-P3, 144Hz, 90W USB-C PD.', 649.00, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 'electronics', 10),
  ('HyperGlide Pro Wireless Mechanical Keyboard', 'Hot-swappable switches, CNC aluminum frame, PBT keycaps, per-key RGB backlighting.', 139.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 'gaming', 35),
  ('Vortex Stealth RGB Gaming Mouse', 'Ultra-lightweight 58g ergonomic esports mouse with 26,000 DPI optical sensor.', 79.99, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800', 'gaming', 40),
  ('Zenith Leather Minimalist MagSafe Wallet', 'Handcrafted full-grain Italian leather with RFID shielding and strong N52 magnets.', 45.00, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', 'accessories', 50),
  ('SonicBlast 360 Waterproof Bluetooth Speaker', 'Room-filling 360-degree omnidirectional sound, IP67 waterproof with 24-hour battery.', 119.00, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800', 'audio', 20)
ON CONFLICT DO NOTHING;
