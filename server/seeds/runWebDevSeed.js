const { runSeedCli } = require('./seedSafety');
const seedWebDev = require('./webDevSeed');

if (require.main === module) {
  runSeedCli(seedWebDev);
}
