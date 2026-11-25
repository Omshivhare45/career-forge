
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { once } = require('node:events');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const express = require('express');
const { getSeedOptions, insertMissing } = require('../seeds/seedSafety');

const confirmation = '--confirm-non-production';
const development = {
  NODE_ENV: 'development',
  SEED_MONGODB_URI: 'mongodb://localhost:27017/careerforge_test'
};

test('seed configuration fails closed in production and without a recognized environment', () => {
  for (const NODE_ENV of ['production', 'staging', '', undefined]) {
    for (const args of [[confirmation], ['--force'], [confirmation, '--force']]) {
      assert.throws(() => getSeedOptions({ ...development, NODE_ENV }, args), /development or test/);
    }
  }
});

test('seed configuration requires a dedicated named target and rejects legacy reset options', () => {
  for (const args of [[], ['--force'], ['--clear-users'], [confirmation, '--force']]) {
    assert.throws(() => getSeedOptions(development, args), /Force and reset/);
  }
  assert.throws(() => getSeedOptions({ ...development, CLEAR_USERS: 'true' }, [confirmation]), /reset/);
  for (const uri of [undefined, 'mongodb://localhost', 'mongodb://localhost/?retryWrites=true']) {
    const env = { ...development, SEED_MONGODB_URI: uri, MONGODB_URI: development.SEED_MONGODB_URI };
    assert.throws(() => getSeedOptions(env, [confirmation]), /database name/);
  }
  assert.deepEqual(getSeedOptions(development, [confirmation]), {
    uri: development.SEED_MONGODB_URI, admin: null
  });
});

test('administrator provisioning is opt-in and requires complete credentials', () => {
  assert.throws(() => getSeedOptions({ ...development, ADMIN_EMAIL: 'admin@example.test' }, [confirmation]), /ADMIN_PASSWORD/);
  assert.throws(() => getSeedOptions({
    ...development, ADMIN_EMAIL: 'admin@example.test', ADMIN_PASSWORD: 'short'
  }, [confirmation]), /ADMIN_PASSWORD/);
  const password = 'fixture-only-password';
  assert.deepEqual(getSeedOptions({
    ...development, ADMIN_EMAIL: ' Admin@Example.Test ', ADMIN_PASSWORD: password
  }, [confirmation]).admin, { email: 'admin@example.test', password });
});

test('existing curriculum is matched by identity and all field changes are insert-only', async () => {
  const existing = { _id: 'existing-video', chapterId: 'chapter', order: 1, title: 'Edited lecture' };
  const identity = { chapterId: existing.chapterId, order: existing.order };
  const Model = {
    findOneAndUpdate(filter, update, options) {
      assert.deepEqual(filter, identity);
      assert.deepEqual(Object.keys(update), ['$setOnInsert']);
      assert.equal(update.$setOnInsert.title, 'Default lecture');
      assert.equal(update.$setOnInsert.chapterId, existing.chapterId);
      assert.equal(update.$setOnInsert._id, undefined);
      assert.ok(update.$setOnInsert.createdAt instanceof Date);
      assert.equal(options.upsert, true);
      assert.equal(options.timestamps, false);
      return existing;
    }
  };
  assert.equal(await insertMissing(Model, identity, { title: 'Default lecture' }), existing);
});

test('seed entry points require the CLI guard and seed sources have no delete or reset calls', () => {
  const directory = resolve(__dirname, '../seeds');
  const sources = new Map(readdirSync(directory).filter(file => file.endsWith('.js')).map(file => [
    file, readFileSync(resolve(directory, file), 'utf8')
  ]));
  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /\.(?:deleteMany|deleteOne|findOneAndDelete|findByIdAndDelete|dropDatabase|dropCollection)\s*\(/, file);
    if (file !== 'seedSafety.js') {
      assert.doesNotMatch(source, /mongoose\.connect|dotenv\.config/, file);
    }
  }
  for (const file of ['seedAll.js', 'dsaJourneySeed.js', 'webDevSeed.js', 'runWebDevSeed.js']) {
    assert.match(sources.get(file), /if \(require\.main === module\) \{\s+runSeedCli\(/, file);
  }
});

test('normal startup serves health and the former migration path returns 404', async (t) => {
  const filename = resolve(__dirname, '../server.js');
  const load = createRequire(filename);
  const app = express();
  let listener;
  let connections = 0;
  let userReads = 0;
  const seedImports = [];
  const errors = [];

  await runInNewContext(readFileSync(filename, 'utf8'), {
    process: {
      env: { NODE_ENV: 'development', JWT_SECRET: 'test-only' },
      exit(code) { assert.fail('Unexpected startup exit ' + code); }
    },
    console: { log() {}, error(...args) { errors.push(args); } },
    require(id) {
      if (id === 'express') {
        const originalListen = app.listen.bind(app);
        app.listen = (_port, callback) => {
          listener = originalListen(0, '127.0.0.1', callback);
        };
        return Object.assign(() => app, express);
      }
      if (id === 'dotenv') return { config() {} };
      if (id === './config/db') return async () => { connections++; };
      if (id === './models/User') {
        return { collection: { name: 'users' }, async countDocuments() { userReads++; return 0; } };
      }
      if (id === './models/Domain') return { async countDocuments() { return 0; } };
      if (id === 'mongoose') return { connection: { name: 'stub' } };
      if (id.startsWith('./routes/')) return express.Router();
      if (id.startsWith('./seeds/')) {
        seedImports.push(id);
        throw new Error('Startup and HTTP must not load seed scripts');
      }
      return load(id);
    }
  });
  assert.ok(listener);
  t.after(() => new Promise((resolveClose, reject) => {
    listener.close(error => error ? reject(error) : resolveClose());
  }));
  await once(listener, 'listening');
  const base = 'http://127.0.0.1:' + listener.address().port;
  const health = await fetch(base + '/api/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).success, true);

  for (const method of ['GET', 'POST']) {
    const response = await fetch(base + '/api/health/seed-db-migration?force=true&secret=test-only', { method });
    assert.equal(response.status, 404);
    await response.text();
  }
  assert.equal(connections, 1);
  assert.equal(userReads, 0);
  assert.deepEqual(seedImports, []);
  assert.deepEqual(errors, []);
});

