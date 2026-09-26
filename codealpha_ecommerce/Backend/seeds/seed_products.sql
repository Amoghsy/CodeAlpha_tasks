-- ==============================================================================
-- Seed Data: seed_products.sql
-- Description: Populate initial catalog with rich tech products in Indian Rupees (₹)
-- ==============================================================================

INSERT INTO public.products (name, description, price, image_url, category, stock_quantity)
VALUES
  (
    'NovaPulse Wireless Noise-Cancelling Headphones',
    'Experience pristine audio clarity and immersive soundscapes. Hybrid active noise cancellation, custom 40mm beryllium drivers, 45-hour battery life.',
    4999.00,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    'audio',
    25
  ),
  (
    'AeroTitan Ultra Smartwatch Series X',
    'Aerospace-grade titanium casing, sapphire crystal AMOLED display, ECG and SpO2 tracking, dual-band GPS with 10 ATM water resistance.',
    6499.00,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    'wearables',
    18
  ),
  (
    'LuminaView 4K Creator Ultra-Wide Monitor 34"',
    'Curved 3440 x 1440 Nano-IPS panel, 98% DCI-P3 color gamut, 144Hz refresh rate, HDR600, and 90W USB-C Power Delivery.',
    28999.00,
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    'electronics',
    10
  ),
  (
    'HyperGlide Pro Wireless Mechanical Keyboard',
    'Hot-swappable linear switches, CNC anodized aluminum frame, double-shot PBT keycaps, per-key RGB backlighting, tri-mode connectivity.',
    3499.00,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    'gaming',
    30
  ),
  (
    'Vortex Stealth RGB Gaming Mouse',
    'Ultra-lightweight 58g ergonomic esports mouse equipped with a 26,000 DPI optical sensor, optical micro-switches, and PTFE glide feet.',
    1899.00,
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    'gaming',
    40
  ),
  (
    'Zenith Leather Minimalist MagSafe Wallet',
    'Handcrafted from full-grain Italian vegetable-tanned leather with built-in RFID shielding and strong N52 neodymium magnets.',
    999.00,
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    'accessories',
    50
  ),
  (
    'SonicBlast 360 Waterproof Bluetooth Speaker',
    'Room-filling 360-degree omnidirectional sound with punchy dual subwoofers. IP67 waterproof and 24-hour battery with power bank output.',
    2499.00,
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    'audio',
    22
  ),
  (
    'OmniCharge 100W GaN Fast Desktop Charger',
    'Next-gen Gallium Nitride 4-port fast charger (3x USB-C PD 3.0, 1x USB-A QC 4.0) with intelligent dynamic power distribution.',
    1999.00,
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    'accessories',
    35
  ),
  (
    'PulseFit Smart Ring Tracker',
    'Ultralight titanium smart ring tracking 24/7 heart rate variability, sleep stages, body temperature, and recovery scores.',
    7999.00,
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    'wearables',
    15
  ),
  (
    'SoundWave Studio USB-C Condenser Microphone',
    'Studio-grade cardioid polar pattern, 24-bit/192kHz sample rate, zero-latency headphone monitoring, and integrated pop filter.',
    3299.00,
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    'electronics',
    20
  );
