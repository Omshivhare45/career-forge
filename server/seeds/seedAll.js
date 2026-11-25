const { insertMissing, runSeedCli } = require('./seedSafety');

const User = require('../models/User');
const Domain = require('../models/Domain');
const Phase = require('../models/Phase');
const Topic = require('../models/Topic');
const Assessment = require('../models/Assessment');
const Badge = require('../models/Badge');
const CloudCredit = require('../models/CloudCredit');

const domainData = require('./domainData');
const phaseData = require('./phaseData');
const topicData = require('./topicData');

const cloudCredits = [
  { title: 'GitHub Student Developer Pack', description: 'Free tools and services for students', link: 'https://education.github.com/pack', platform: 'GitHub', icon: '🐙', category: 'education', eligibility: 'Students with .edu email or proof of enrollment', order: 1 },
  { title: 'Google Cloud Free Program', description: '$300 free credits for 90 days', link: 'https://cloud.google.com/free', platform: 'Google Cloud', icon: '☁️', category: 'cloud', order: 2 },
  { title: 'Google Cloud Skills Boost', description: 'Free hands-on labs and learning paths', link: 'https://www.cloudskillsboost.google/', platform: 'Google Cloud', icon: '🎓', category: 'education', order: 3 },
  { title: 'Microsoft Azure for Students', description: '$100 free credit, no credit card required', link: 'https://azure.microsoft.com/free/students', platform: 'Azure', icon: '🔷', category: 'cloud', order: 4 },
  { title: 'AWS Free Tier', description: '12 months free on 25+ products', link: 'https://aws.amazon.com/free/', platform: 'AWS', icon: '🟠', category: 'cloud', order: 5 },
  { title: 'Oracle Cloud Free Tier', description: 'Always-free services including VMs', link: 'https://www.oracle.com/cloud/free/', platform: 'Oracle', icon: '🔴', category: 'cloud', order: 6 },
  { title: 'MongoDB Atlas Free Tier', description: 'Free 512MB shared cluster forever', link: 'https://www.mongodb.com/cloud/atlas/register', platform: 'MongoDB', icon: '🍃', category: 'database', order: 7 },
  { title: 'Vercel Free Hosting', description: 'Free deployment for frontend projects', link: 'https://vercel.com/', platform: 'Vercel', icon: '▲', category: 'hosting', order: 8 },
  { title: 'Netlify Free Tier', description: 'Free hosting with CI/CD', link: 'https://www.netlify.com/', platform: 'Netlify', icon: '🟢', category: 'hosting', order: 9 },
  { title: 'Render Free Tier', description: 'Free web services and databases', link: 'https://render.com/', platform: 'Render', icon: '⚡', category: 'hosting', order: 10 },
  { title: 'Railway Free Plan', description: 'Deploy apps with free monthly credits', link: 'https://railway.app/', platform: 'Railway', icon: '🚂', category: 'hosting', order: 11 }
];
async function seedDB(admin) {
  // Seed cloud credits (upsert by title)
  for (const credit of cloudCredits) {
    await insertMissing(CloudCredit,
      { title: credit.title },
      credit
    );
  }
  console.log('☁️  Cloud credits seeded');

  if (admin && !(await User.exists({ email: admin.email }))) {
    await User.create({ fullName: 'CareerForge Admin', ...admin, role: 'admin' });
  }

  // Seed domains and their phases/topics (upsert-based to preserve ObjectIds)
  for (const domainInfo of domainData) {
    const phases = phaseData[domainInfo.slug] || [];
    const domain = await insertMissing(Domain,
      { slug: domainInfo.slug },
      { ...domainInfo, totalPhases: phases.length }
    );
    console.log(`📁 Domain: ${domain.name}`);

    for (const phaseInfo of phases) {
      // Shift phaseNumber to start at 0 if the domain is not already 0-indexed (like WebDev and DSA)
      const needsShift = (domain.slug !== 'dsa' && domain.slug !== 'web-development');
      const adjustedPhaseNumber = needsShift ? (phaseInfo.phaseNumber - 1) : phaseInfo.phaseNumber;

      const phase = await insertMissing(Phase,
        { domainId: domain._id, phaseNumber: adjustedPhaseNumber },
        {
          ...phaseInfo,
          phaseNumber: adjustedPhaseNumber,
          domainId: domain._id,
          order: adjustedPhaseNumber
        }
      );

      // Add topics for this phase if available (lookup using the original phaseNumber key)
      const topicKey = `${domain.slug}:${phaseInfo.phaseNumber}`;
      const topics = topicData[topicKey] || [];
      for (const topicInfo of topics) {
        const topic = await insertMissing(Topic,
          { domainId: domain._id, phaseId: phase._id, title: topicInfo.title },
          { ...topicInfo, phaseId: phase._id, domainId: domain._id }
        );
          
        // Create topic completion badge (One video = One badge)
        await insertMissing(Badge,
          { domainId: domain._id, phaseId: phase._id, topicId: topic._id, type: 'topic-completion' },
          {
            name: `${topic.title} Badge`,
            description: `Completed "${topic.title}" in ${domain.name}`,
            icon: '📜',
            domainId: domain._id,
            phaseId: phase._id,
            topicId: topic._id,
            type: 'topic-completion',
            unlockCondition: `Complete the ${topic.title} topic`,
            order: topic.order
          }
        );
      }

      // Add default assessment for each phase
      await insertMissing(Assessment,
        { domainId: domain._id, phaseId: phase._id },
        {
          phaseId: phase._id,
          domainId: domain._id,
          title: `${phase.name} Assessment`,
          description: `Assessment for ${phase.name}`,
          type: 'custom',
          platform: 'HackerRank',
          assessmentLink: 'ADMIN_WILL_ADD_HACKERRANK_ASSESSMENT_LINK',
          passingScore: 60,
          difficultyRating: phase.phaseNumber <= 3 ? 'beginner' : phase.phaseNumber <= 7 ? 'intermediate' : 'advanced',
          maxAttempts: 3,
          unlocksNextPhase: true,
          order: phase.phaseNumber
        }
      );

      // Add phase badge
      await insertMissing(Badge,
        { domainId: domain._id, phaseId: phase._id, type: 'phase-completion' },
        {
          name: `${phase.name} Badge`,
          description: `Completed ${phase.name} in ${domain.name}`,
          icon: '🏅',
          domainId: domain._id,
          phaseId: phase._id,
          type: 'phase-completion',
          unlockCondition: `Complete all topics in ${phase.name} and pass assessment`,
          order: phase.phaseNumber
        }
      );
    }

    // Domain completion badge
    await insertMissing(Badge,
      { domainId: domain._id, type: 'domain-completion' },
      {
        name: `${domain.name} Master`,
        description: `Completed the entire ${domain.name} roadmap`,
        icon: '🏆',
        domainId: domain._id,
        type: 'domain-completion',
        unlockCondition: `Complete all ${phases.length} phases in ${domain.name}`,
        order: 999
      }
    );
  }

  // Streak badges
  const streakBadges = [
    { name: 'Bronze Badge', description: 'Studied 5 days in a row', icon: '🥉', type: 'streak', unlockCondition: 'Maintain 5-day study streak' },
    { name: 'Monthly Badge', description: 'Studied 30 days in a row', icon: '📅', type: 'streak', unlockCondition: 'Maintain 30-day study streak' },
    { name: 'First Step', description: 'Completed your first topic', icon: '👣', type: 'special', unlockCondition: 'Complete any topic' },
    { name: 'Base Case Beginner', description: 'Solved your first recursion checkpoint', icon: '🧱', type: 'special', unlockCondition: 'Complete checkpoint 1 of Recursion' },
    { name: 'Stack Explorer', description: 'Understood function call stacks', icon: '📚', type: 'special', unlockCondition: 'Complete checkpoint 10 of Recursion' },
    { name: 'Backtracking Warrior', description: 'Mastered backtracking techniques', icon: '⚔️', type: 'special', unlockCondition: 'Complete checkpoint 15 of Recursion' },
    { name: 'Recursion Survivor', description: 'Completed all recursion challenges', icon: '👑', type: 'special', unlockCondition: 'Complete all 22 checkpoints' }
  ];
  for (const badgeInfo of streakBadges) {
    await insertMissing(Badge,
      { name: badgeInfo.name },
      badgeInfo
    );
  }

  await require('./seedProblems')();
  await require('./academicSeed')();
}

if (require.main === module) {
  runSeedCli(seedDB);
}
