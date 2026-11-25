const { insertMissing } = require('./seedSafety');
const Domain = require('../models/Domain');
const Phase = require('../models/Phase');
const Problem = require('../models/Problem');
const User = require('../models/User');
const sampleProblems = require('./problemData');

async function seedProblemBank() {
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  const domain = await Domain.findOne({ slug: 'dsa' }).select('_id');

  if (!admin || !domain) {
    return;
  }

  for (const entry of sampleProblems) {
    const phase = await Phase.findOne({
      domainId: domain._id,
      phaseNumber: entry.phaseNumber
    }).select('_id');

    const payload = {
      ...entry,
      domain: domain._id,
      phase: phase?._id || null,
      createdBy: admin._id,
      isPublished: true
    };

    await insertMissing(Problem, { slug: entry.slug }, payload);
  }
}

module.exports = seedProblemBank;
