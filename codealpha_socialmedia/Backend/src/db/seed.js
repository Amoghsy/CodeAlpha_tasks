/**
 * Vibesta Comprehensive Development Database Seeder
 * Populates diverse demo accounts, rich visual posts, comments, likes, and follow relationships.
 * 
 * Run with: npm run seed
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');

async function seed() {
  console.log('🌱 Starting Vibesta database seed...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Diverse Demo Creator Users
    const demoUsers = [
      {
        username: 'sarah_designs',
        email: 'sarah.designs@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Sarah Miller',
        bio: 'Product Designer & Visual Stylist 🎨 Designing the future of digital experiences.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'alex_wanderer',
        email: 'alex.wanderer@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Alex Rivera',
        bio: 'Travel photographer & filmmaker ✨ Chasing golden hours around the globe ✈️',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'elena_snaps',
        email: 'elena.snaps@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Elena Rostova',
        bio: 'Editorial & street fashion portraiture 📸 Living in Berlin 🇩🇪',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'maya_art',
        email: 'maya.art@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Maya Chen',
        bio: '3D Designer & Visual Artist 🔮 Exploring fluid forms and iridescent dimensions.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'sam_travels',
        email: 'sam.travels@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Sam Wilson',
        bio: 'Hiking, summiting & ocean diving 🏔️🌊 48 countries & counting.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'marcus_tech',
        email: 'marcus.tech@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Marcus Vance',
        bio: 'Minimalist setups, mechanical keyboards & tech aesthetics ⚡ #setupinspiration',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      },
      {
        username: 'chloe_bakes',
        email: 'chloe.bakes@vibesta.app',
        password_hash: passwordHash,
        full_name: 'Chloe Bennett',
        bio: 'Artisan sourdough & specialty matcha in Kyoto 🍵 Fresh recipes daily!',
        avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      },
    ];

    console.log('👤 Seeding demo users...');
    const userMap = {};

    for (const u of demoUsers) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .or(`username.eq.${u.username},email.eq.${u.email}`)
        .maybeSingle();

      if (existingUser) {
        await supabase.from('users').update({
          full_name: u.full_name,
          bio: u.bio,
          avatar_url: u.avatar_url,
          password_hash: passwordHash,
        }).eq('id', existingUser.id);
        userMap[u.username] = existingUser.id;
      } else {
        const { data: insertedUser, error: insErr } = await supabase
          .from('users')
          .insert([u])
          .select('id, username')
          .single();

        if (insErr) {
          console.warn(`Could not insert user ${u.username}:`, insErr.message);
        } else if (insertedUser) {
          userMap[u.username] = insertedUser.id;
        }
      }
    }

    // Also include existing users (like 'amgsy') in mapping
    const { data: allUsers } = await supabase.from('users').select('id, username');
    (allUsers || []).forEach((u) => {
      userMap[u.username] = u.id;
    });

    // 2. Create Diverse Demo Posts
    const demoPosts = [
      {
        user_id: userMap['sarah_designs'],
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Morning serenity on the Mediterranean coast 🌊 Finding calm before diving into product sprints. #design #vibes',
      },
      {
        user_id: userMap['alex_wanderer'],
        image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
        caption: 'Neon nights in Shibuya 🌃 The pulse of Tokyo never sleeps. Captured on 35mm. #Tokyo #StreetPhotography',
      },
      {
        user_id: userMap['maya_art'],
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        caption: 'Iridescent Waves 🔮 Experimenting with glass refraction and gradient light caustics in Blender. Thoughts? ✨',
      },
      {
        user_id: userMap['elena_snaps'],
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Editorial series in Kreuzberg 🧥 Sunlight hitting just at the right angle. Styled with vintage archival pieces.',
      },
      {
        user_id: userMap['marcus_tech'],
        image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        caption: 'Clean lines, zero clutter desk setup. Dual 4K panels calibrated for UI design & late night coding sessions ⚡',
      },
      {
        user_id: userMap['sam_travels'],
        image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset canyon trail run 🏜️ Over 14 miles logged today. Nature is the best therapy. #Adventure #Wanderlust',
      },
      {
        user_id: userMap['chloe_bakes'],
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        caption: 'Handcrafted brioche with whipped mascarpone & summer berries 🍓 Weekends in the kitchen are sacred.',
      },
      {
        user_id: userMap['alex_wanderer'],
        image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Misty sunrise overlooking Kyoto’s bamboo groves 🎋 Unmatched peace at 6:00 AM.',
      },
      {
        user_id: userMap['sarah_designs'],
        image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Architectural minimalism 🛋️ Soft textures, natural timber, and warm amber light.',
      },
    ].filter((p) => !!p.user_id);

    console.log('📸 Seeding demo posts...');
    const { data: createdPosts, error: postError } = await supabase
      .from('posts')
      .insert(demoPosts)
      .select('id, user_id, caption');

    if (postError) {
      console.error('❌ Failed to seed posts:', postError.message);
      return;
    }

    // 3. Create Sample Comments
    if (createdPosts && createdPosts.length > 0) {
      console.log('💬 Seeding demo comments...');
      const demoComments = [];
      const commenterIds = Object.values(userMap);

      createdPosts.forEach((post, idx) => {
        const otherUsers = commenterIds.filter((uid) => uid !== post.user_id);
        if (otherUsers.length >= 2) {
          demoComments.push({
            post_id: post.id,
            user_id: otherUsers[0],
            content: idx % 2 === 0 ? 'Incredible shot! The colors and lighting are stunning 🔥' : 'This aesthetic is on another level! ✨',
          });
          demoComments.push({
            post_id: post.id,
            user_id: otherUsers[1],
            content: 'Love this perspective! Where was this taken? 😍',
          });
        }
      });

      if (demoComments.length > 0) {
        await supabase.from('comments').insert(demoComments);
      }
    }

    // 4. Create Sample Likes
    if (createdPosts && createdPosts.length > 0) {
      console.log('❤️ Seeding demo likes...');
      const demoLikes = [];
      const userList = Object.values(userMap);

      createdPosts.forEach((post) => {
        userList.forEach((uid) => {
          demoLikes.push({
            post_id: post.id,
            user_id: uid,
          });
        });
      });

      if (demoLikes.length > 0) {
        await supabase.from('likes').upsert(demoLikes, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
      }
    }

    // 5. Create Follow Relationships (Each demo account follows each other)
    console.log('🤝 Seeding follow connections...');
    const followPairs = [];
    const accounts = ['sarah_designs', 'alex_wanderer', 'elena_snaps', 'maya_art', 'sam_travels', 'marcus_tech', 'chloe_bakes'];

    accounts.forEach((u1) => {
      accounts.forEach((u2) => {
        if (u1 !== u2 && userMap[u1] && userMap[u2]) {
          followPairs.push({
            follower_id: userMap[u1],
            following_id: userMap[u2],
          });
        }
      });
    });

    // If active user 'amgsy' exists, connect follow relationships
    if (userMap['amgsy']) {
      accounts.forEach((acc) => {
        if (userMap[acc]) {
          followPairs.push({
            follower_id: userMap['amgsy'],
            following_id: userMap[acc],
          });
          followPairs.push({
            follower_id: userMap[acc],
            following_id: userMap['amgsy'],
          });
        }
      });
    }

    if (followPairs.length > 0) {
      await supabase.from('follows').upsert(followPairs, {
        onConflict: 'follower_id,following_id',
        ignoreDuplicates: true,
      });
    }

    console.log('🎉 Database seed completed successfully!');
    console.log(`✨ Seeded ${Object.keys(userMap).length} creator accounts with high-resolution posts, comments, likes, and follows.`);
    console.log('🔑 Password for all demo accounts: "password123"');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
  }
}

seed().then(() => {
  setTimeout(() => process.exit(0), 100);
});
