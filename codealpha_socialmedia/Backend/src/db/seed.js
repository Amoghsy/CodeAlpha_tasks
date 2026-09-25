/**
 * Vibesta Development Database Seeder
 * Populates sample demo users, posts, comments, likes, and follows.
 * 
 * Run with: npm run seed
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');

async function seed() {
  console.log('🌱 Starting Vibesta database seed...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Demo Users
    const demoUsers = [
      {
        username: 'alex_vibes',
        email: 'alex@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Alex Rivera',
        bio: 'Digital creator & photographer ✨ Living in Tokyo 🇯🇵',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'maya_art',
        email: 'maya@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Maya Chen',
        bio: '3D Designer & Visual Artist 🎨 Creating tomorrow’s vibes',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'sam_travels',
        email: 'sam@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Sam Wilson',
        bio: 'Exploring every corner of the planet 🌍 45 countries & counting',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
      },
    ];

    console.log('👤 Seeding demo users...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .upsert(demoUsers, { onConflict: 'username' })
      .select('id, username');

    if (userError) {
      console.error('❌ Failed to seed users:', userError.message);
      return;
    }

    const userMap = {};
    users.forEach((u) => {
      userMap[u.username] = u.id;
    });

    // 2. Create Demo Posts
    const demoPosts = [
      {
        user_id: userMap['alex_vibes'],
        image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1080&q=80',
        caption: 'Neon nights in Shibuya 🌃 The energy here never stops! #Tokyo #NightVibes',
      },
      {
        user_id: userMap['maya_art'],
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
        caption: 'Abstract dreams 🔮 Exploring fluid forms and iridescent materials.',
      },
      {
        user_id: userMap['sam_travels'],
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
        caption: 'Golden hour at the turquoise coast 🌊 Nothing beats ocean breeze. #BeachLife',
      },
    ];

    console.log('📸 Seeding demo posts...');
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .insert(demoPosts)
      .select('id, caption');

    if (postError) {
      console.error('❌ Failed to seed posts:', postError.message);
      return;
    }

    // 3. Create Follow Relationships
    console.log('🤝 Seeding follow connections...');
    if (userMap['alex_vibes'] && userMap['maya_art']) {
      await supabase.from('follows').upsert(
        [
          { follower_id: userMap['alex_vibes'], following_id: userMap['maya_art'] },
          { follower_id: userMap['maya_art'], following_id: userMap['alex_vibes'] },
          { follower_id: userMap['sam_travels'], following_id: userMap['alex_vibes'] },
        ],
        { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
      );
    }

    console.log('🎉 Seed completed successfully!');
    console.log('Credentials for all demo users: Password is "password123"');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
  }
}

seed().then(() => process.exit(0));
