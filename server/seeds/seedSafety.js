function getSeedOptions(env, args) {
  if (!['development', 'test'].includes(env.NODE_ENV)) {
    throw new Error('Seeding requires an explicit development or test environment.');
  }
  if (args.length !== 1 || args[0] !== '--confirm-non-production' || env.CLEAR_USERS === 'true') {
    throw new Error('Pass --confirm-non-production. Force and reset options are unsupported.');
  }
  const uri = env.SEED_MONGODB_URI;
  if (!uri || !/^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?#]+(?:\?|$)/.test(uri)) {
    throw new Error('Set SEED_MONGODB_URI to a dedicated non-production database, including its database name.');
  }
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if ((env.ADMIN_EMAIL !== undefined || password !== undefined) &&
      (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
       !password || password.trim().length < 16 || Buffer.byteLength(password, 'utf8') > 72)) {
    throw new Error('Optional admin provisioning requires ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 16 characters and at most 72 bytes.');
  }
  return { uri, admin: email ? { email, password } : null };
}

async function runSeedCli(seed) {
  let options;
  try {
    options = getSeedOptions(process.env, process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const mongoose = require('mongoose');
  try {
    await mongoose.connect(options.uri);
    await seed(options.admin);
    console.log('Seed completed.');
  } catch {
    console.error('Seed failed. Check database access and seed data before retrying.');
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      console.error('Could not close the seed database connection.');
      process.exitCode = 1;
    }
  }
}

function insertMissing(Model, identity, data) {
  const now = new Date();
  return Model.findOneAndUpdate(
    identity,
    { $setOnInsert: { ...data, ...identity, createdAt: now, updatedAt: now } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, timestamps: false }
  );
}

module.exports = { getSeedOptions, runSeedCli, insertMissing };
