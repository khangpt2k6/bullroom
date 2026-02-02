require('dotenv').config({ path: '../api-gateway/.env' });
const mongoose = require('mongoose');
const Room = require('../shared/models/Room');
const User = require('../shared/models/User');

// configure usf colors
const USF_GREEN = '#006747';
const USF_GOLD = '#CFC493';

// Room data
const rooms = [
  // LIBRARY ROOMS
  { _id: 'LIB-224', building: 'Library', floor: 2, type: 'Individual', capacity: '1-2', description: 'Quiet individual study room', available: true, features: ['Whiteboard'] },
  { _id: 'LIB-225', building: 'Library', floor: 2, type: 'Individual', capacity: '1-2', description: 'Small room with chair & table', available: true, features: ['Power outlets'] },
  { _id: 'LIB-230', building: 'Library', floor: 2, type: 'Group', capacity: '2-4', description: 'Group study space', available: true, features: ['Whiteboard', 'Monitor'] },
  { _id: 'LIB-305', building: 'Library', floor: 3, type: 'Group', capacity: '2-4', description: 'Group study with bench seating', available: false, features: ['Monitor', 'Power outlets'] },
  { _id: 'LIB-306', building: 'Library', floor: 3, type: 'Group', capacity: '2-4', description: 'Team work study room', available: true, features: ['Whiteboard'] },
  { _id: 'LIB-308', building: 'Library', floor: 3, type: 'Large Group', capacity: '4-6', description: 'Large group meeting room', available: false, features: ['Large table', 'TV'] },
  { _id: 'LIB-401', building: 'Library', floor: 4, type: 'Individual', capacity: '1-2', description: 'Quiet corner study room', available: true, features: ['Power outlets'] },
  { _id: 'LIB-445', building: 'Library', floor: 4, type: 'Individual', capacity: '1-2', description: 'Window view small room', available: false, features: ['Whiteboard'] },
  { _id: 'LIB-450', building: 'Library', floor: 4, type: 'Group', capacity: '2-4', description: 'Group study near stacks', available: true, features: ['Monitor'] },
  { _id: 'LIB-460', building: 'Library', floor: 4, type: 'Large Group', capacity: '4-6', description: 'Large group conference room', available: true, features: ['TV', 'Conference phone'] },

  // Marshall Student Center ROOMS - Floor 27
  { _id: 'MSC-2700', building: 'MSC', floor: 27, type: 'Individual', capacity: '1-2', description: 'Private study room', available: true, features: ['Whiteboard', 'Power outlets'] },
  { _id: 'MSC-2701', building: 'MSC', floor: 27, type: 'Individual', capacity: '1-2', description: 'Quiet study space', available: true, features: ['Desk lamp'] },
  { _id: 'MSC-2702', building: 'MSC', floor: 27, type: 'Group', capacity: '2-4', description: 'Small group collaboration room', available: true, features: ['Whiteboard', 'Monitor'] },
  { _id: 'MSC-2705', building: 'MSC', floor: 27, type: 'Large Group', capacity: '4-6', description: 'Large team room', available: true, features: ['TV', 'Conference table'] },
  { _id: 'MSC-2706', building: 'MSC', floor: 27, type: 'Individual', capacity: '1-2', description: 'Corner study room', available: true, features: ['Window', 'Power outlets'] },
  { _id: 'MSC-2708', building: 'MSC', floor: 27, type: 'Group', capacity: '2-4', description: 'Project team room', available: true, features: ['Monitor'] },
  { _id: 'MSC-2709', building: 'MSC', floor: 27, type: 'Large Group', capacity: '4-6', description: 'Meeting room', available: true, features: ['TV', 'Whiteboard'] },
  // Marshall Student Center - Floor 37
  { _id: 'MSC-3700', building: 'MSC', floor: 37, type: 'Individual', capacity: '1-2', description: 'Individual study room', available: true, features: ['Whiteboard'] },
  { _id: 'MSC-3701', building: 'MSC', floor: 37, type: 'Individual', capacity: '1-2', description: 'Private workspace', available: true, features: ['Power outlets'] },
  { _id: 'MSC-3702', building: 'MSC', floor: 37, type: 'Group', capacity: '2-4', description: 'Team study room', available: false, features: ['Monitor', 'Whiteboard'] },
  { _id: 'MSC-3704', building: 'MSC', floor: 37, type: 'Group', capacity: '2-4', description: 'Group study area', available: true, features: ['Monitor'] },
  { _id: 'MSC-3705', building: 'MSC', floor: 37, type: 'Large Group', capacity: '4-6', description: 'Large study room', available: true, features: ['TV', 'Large table'] },
  { _id: 'MSC-3707', building: 'MSC', floor: 37, type: 'Group', capacity: '2-4', description: 'Team workspace', available: true, features: ['Whiteboard', 'Monitor'] },
  { _id: 'MSC-3708', building: 'MSC', floor: 37, type: 'Group', capacity: '2-4', description: 'Study group room', available: true, features: ['Power outlets'] },
  { _id: 'MSC-3712', building: 'MSC', floor: 37, type: 'Large Group', capacity: '4-6', description: 'Large meeting room', available: true, features: ['TV', 'Whiteboard', 'Conference table'] },

  // Engineering Building ROOMS - Floor 1
  { _id: 'ENB-100', building: 'ENB', floor: 1, type: 'Individual', capacity: '1-2', description: 'Engineering study room', available: true, features: ['Whiteboard', 'Power outlets'] },
  { _id: 'ENB-101', building: 'ENB', floor: 1, type: 'Group', capacity: '2-4', description: 'Design team room', available: true, features: ['Monitor', 'Whiteboard'] },
  { _id: 'ENB-102', building: 'ENB', floor: 1, type: 'Large Group', capacity: '4-6', description: 'Senior project room', available: false, features: ['TV', 'Large table', 'Whiteboard'] },
  { _id: 'ENB-103', building: 'ENB', floor: 1, type: 'Group', capacity: '2-4', description: 'Lab prep study room', available: true, features: ['Whiteboard'] },

  // Engineering Building - Floor 2
  { _id: 'ENB-200', building: 'ENB', floor: 2, type: 'Individual', capacity: '1-2', description: 'Private study space', available: true, features: ['Desk', 'Chair'] },
  { _id: 'ENB-201', building: 'ENB', floor: 2, type: 'Group', capacity: '2-4', description: 'Team collaboration room', available: false, features: ['Monitor', 'Whiteboard'] },
  { _id: 'ENB-202', building: 'ENB', floor: 2, type: 'Large Group', capacity: '4-6', description: 'Capstone project room', available: true, features: ['TV', 'Conference phone', 'Whiteboard'] },
  { _id: 'ENB-203', building: 'ENB', floor: 2, type: 'Group', capacity: '2-4', description: 'Study group space', available: true, features: ['Whiteboard', 'Power outlets'] },

  // ENB - Floor 3
  { _id: 'ENB-300', building: 'ENB', floor: 3, type: 'Individual', capacity: '1-2', description: 'Quiet engineering study room', available: true, features: ['Power outlets'] },
  { _id: 'ENB-301', building: 'ENB', floor: 3, type: 'Group', capacity: '2-4', description: 'Group project room', available: true, features: ['Monitor', 'Whiteboard'] },
  { _id: 'ENB-302', building: 'ENB', floor: 3, type: 'Large Group', capacity: '4-6', description: 'Large engineering workspace', available: true, features: ['TV', 'Large table'] },
  { _id: 'ENB-303', building: 'ENB', floor: 3, type: 'Group', capacity: '2-4', description: 'Design studio', available: false, features: ['Whiteboard', 'Monitor'] }
];

const users = [
  { name: 'Test Student', email: 'student@usf.edu', role: 'student' },
  { name: 'Admin User', email: 'admin@usf.edu', role: 'admin' }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // clear existing data
    console.log('🗑️  Clearing existing data...');
    await Room.deleteMany({});
    await User.deleteMany({});

    // insert rooms
    console.log('📦 Inserting rooms...');
    await Room.insertMany(rooms);
    console.log(`✅ Inserted ${rooms.length} rooms`);

    // insert users
    console.log('👤 Inserting test users...');
    await User.insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`   Total Rooms: ${rooms.length}`);
    console.log(`   - Library: ${rooms.filter(r => r.building === 'Library').length} rooms`);
    console.log(`   - MSC: ${rooms.filter(r => r.building === 'MSC').length} rooms`);
    console.log(`   - ENB: ${rooms.filter(r => r.building === 'ENB').length} rooms`);
    console.log(`   Total Users: ${users.length}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🎓 You can now start booking rooms in BullRoom!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
