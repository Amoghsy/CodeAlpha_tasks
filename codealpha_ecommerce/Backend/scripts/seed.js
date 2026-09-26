require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sampleProducts = [
  {
    name: 'NovaPulse Wireless Noise-Cancelling Headphones',
    description: 'Experience pristine audio clarity and immersive soundscapes. Hybrid active noise cancellation, custom 40mm beryllium drivers, 45-hour battery life.',
    price: 4999.00,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    category: 'audio',
    stock_quantity: 25
  },
  {
    name: 'AeroTitan Ultra Smartwatch Series X',
    description: 'Aerospace-grade titanium casing, sapphire crystal AMOLED display, ECG and SpO2 tracking, dual-band GPS with 10 ATM water resistance.',
    price: 6499.00,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    category: 'wearables',
    stock_quantity: 18
  },
  {
    name: 'LuminaView 4K Creator Ultra-Wide Monitor 34"',
    description: 'Curved 3440 x 1440 Nano-IPS panel, 98% DCI-P3 color gamut, 144Hz refresh rate, HDR600, and 90W USB-C Power Delivery.',
    price: 28999.00,
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    category: 'electronics',
    stock_quantity: 10
  },
  {
    name: 'HyperGlide Pro Wireless Mechanical Keyboard',
    description: 'Hot-swappable linear switches, CNC anodized aluminum frame, double-shot PBT keycaps, per-key RGB backlighting, tri-mode connectivity.',
    price: 3499.00,
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    category: 'gaming',
    stock_quantity: 30
  },
  {
    name: 'Vortex Stealth RGB Gaming Mouse',
    description: 'Ultra-lightweight 58g ergonomic esports mouse equipped with a 26,000 DPI optical sensor, optical micro-switches, and PTFE glide feet.',
    price: 1899.00,
    image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    category: 'gaming',
    stock_quantity: 40
  },
  {
    name: 'Zenith Leather Minimalist MagSafe Wallet',
    description: 'Handcrafted from full-grain Italian vegetable-tanned leather with built-in RFID shielding and strong N52 neodymium magnets.',
    price: 999.00,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    category: 'accessories',
    stock_quantity: 50
  },
  {
    name: 'SonicBlast 360 Waterproof Bluetooth Speaker',
    description: 'Room-filling 360-degree omnidirectional sound with punchy dual subwoofers. IP67 waterproof and 24-hour battery with power bank output.',
    price: 2499.00,
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    category: 'audio',
    stock_quantity: 22
  },
  {
    name: 'OmniCharge 100W GaN Fast Desktop Charger',
    description: 'Next-gen Gallium Nitride 4-port fast charger (3x USB-C PD 3.0, 1x USB-A QC 4.0) with intelligent dynamic power distribution.',
    price: 1999.00,
    image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    category: 'accessories',
    stock_quantity: 35
  },
  {
    name: 'PulseFit Smart Ring Tracker',
    description: 'Ultralight titanium smart ring tracking 24/7 heart rate variability, sleep stages, body temperature, and recovery scores.',
    price: 7999.00,
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    category: 'wearables',
    stock_quantity: 15
  },
  {
    name: 'SoundWave Studio USB-C Condenser Microphone',
    description: 'Studio-grade cardioid polar pattern, 24-bit/192kHz sample rate, zero-latency headphone monitoring, and integrated pop filter.',
    price: 3299.00,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    category: 'electronics',
    stock_quantity: 20
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding on Supabase with Indian Rupees (₹)...\n');

  try {
    // 1. Check if products table exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (checkError) {
      console.error('❌ Could not query products table. Have you run the migration script in Supabase yet?');
      console.error('Details:', checkError.message);
      process.exit(1);
    }

    console.log(`📦 Updating/Inserting ${sampleProducts.length} curated products in ₹...`);

    // Clean existing products if needed and re-insert fresh values
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Successfully seeded ${inserted.length} products with Indian Rupee prices!`);
    console.log('\n🎉 Database seeding completed successfully!\n');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err.message);
    process.exit(1);
  }
}

seedDatabase();
