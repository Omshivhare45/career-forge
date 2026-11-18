const Domain = require('../models/Domain');
const Phase = require('../models/Phase');
const Topic = require('../models/Topic');

const AVAILABLE_SLUGS = ['devops', 'dsa', 'web-development'];
const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'vimeo.com'];
const GUEST_TEXT_LESSONS = {
  devops: {
    'Linux Basics': `Linux uses a single directory tree that begins at /. Your home directory is usually under /home, system configuration lives in /etc, changing application data is commonly stored in /var, and temporary files belong in /tmp.

Start by navigating and inspecting safely:
- pwd prints your current directory.
- ls -la lists files, including hidden files and details.
- cd changes directories; cd .. moves to the parent directory.
- mkdir creates a directory, while cp and mv copy and move files.

In an ls -l listing, permissions are shown for the owner, group, and other users. Each group can have read (r), write (w), and execute (x) permissions. Inspect permissions before changing them, and avoid using elevated privileges unless a task requires them.`,
    'User Management': `Linux identifies accounts with user IDs (UIDs) and groups with group IDs (GIDs). Groups make it easier to grant a set of users access to shared files and services.

Useful read-only checks include id to see your UID and groups, and groups to list group memberships. Administrators commonly use useradd to create accounts and passwd to set passwords. The usermod -aG group user pattern adds an account to a supplementary group without replacing its existing groups.

Use sudo only for a specific administrative task, and grant the least privilege needed. Account and group records are maintained in system files such as /etc/passwd and /etc/group; password hashes are stored separately and should never be shared.`
  },
  dsa: {
    'Start Coding': `A program is a sequence of instructions. Begin with a small input/output program, then build up to reusable functions.

Core building blocks:
- Variables hold values; choose a type that matches the data you need.
- Conditions (if/else) choose which instructions run.
- Loops repeat work; make sure each loop can reach a stopping condition.
- Functions give a task a name, accept inputs, and can return a result.

For a simple problem, write down the input and expected output, solve one small example by hand, and translate those steps into code. Test normal cases and edge cases such as empty input or a single item. In C++, the standard library provides ready-to-use collections such as vector and string; learn to iterate through them before moving on to data structures and algorithms.`
  },
  'web-development': {
    'HTML, CSS and JavaScript Basics': `A web page combines structure, presentation, and behavior:
- HTML describes content and its meaning. Use semantic elements such as header, nav, main, section, and button.
- CSS controls layout and appearance. Select elements with classes and use the box model (content, padding, border, margin) to reason about spacing.
- JavaScript responds to user actions and updates page behavior. Keep the structure in HTML, styles in CSS, and interaction logic in JavaScript.

Build a small page by adding a heading and form in HTML, styling them with CSS, then attaching a JavaScript event listener to validate the form. Prefer native elements and labels so the page works with keyboards and assistive technology.`,
    'Responsive Web Design & Layouts': `Responsive design lets a layout adapt to different screen sizes instead of assuming one fixed width.

Start with a flexible layout and mobile-first CSS. Use Flexbox for one-dimensional alignment (a row or column) and CSS Grid for layouts with rows and columns. Relative widths and a sensible max-width help content fit between narrow phones and wide displays.

Media queries apply changes when the viewport reaches a breakpoint, for example:
@media (min-width: 48rem) {
  .layout { grid-template-columns: 1fr 1fr; }
}

Test by resizing the browser and checking that text remains readable, controls are usable, and content does not overflow horizontally.`
  }
};
const RESOURCE_FIELDS = [
  ['theoryLink', 'Theory'],
  ['gfgLink', 'GeeksforGeeks'],
  ['documentationLink', 'Documentation'],
  ['notesLink', 'Notes'],
  ['practiceLink', 'Practice']
];

const isVideoUrl = (value) => {
  try {
    const url = new URL(value);
    return VIDEO_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

const getTextResources = (topic) => RESOURCE_FIELDS
  .map(([field, label]) => ({ label, url: topic[field] }))
  .filter(({ url }) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) && !isVideoUrl(url);
    } catch {
      return false;
    }
  });

const toGuestTopic = (topic, domainSlug) => ({
  _id: topic._id,
  title: topic.title,
  description: topic.description,
  estimatedTime: topic.estimatedTime,
  theoryNotes: topic.theoryNotes || GUEST_TEXT_LESSONS[domainSlug]?.[topic.title] || topic.description,
  textResources: getTextResources(topic),
  hasVideo: Boolean(
    topic.youtubeLink ||
    topic.checkpoints?.some((checkpoint) => checkpoint.youtubeLink) ||
    RESOURCE_FIELDS.some(([field]) => isVideoUrl(topic[field]))
  )
});

exports.getGuestDomains = async (req, res) => {
  try {
    const domains = await Domain.find({
      slug: { $in: AVAILABLE_SLUGS },
      isActive: true
    })
      .select('name slug shortDescription icon color')
      .sort('order');

    res.json({ success: true, data: domains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuestRoadmap = async (req, res) => {
  try {
    if (!AVAILABLE_SLUGS.includes(req.params.slug)) {
      return res.status(404).json({ success: false, message: 'Guest roadmap not found' });
    }

    const domain = await Domain.findOne({ slug: req.params.slug, isActive: true })
      .select('name slug shortDescription icon color');
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Guest roadmap not found' });
    }

    const phases = await Phase.find({ domainId: domain._id, isActive: true })
      .select('phaseNumber name description estimatedDuration')
      .sort('phaseNumber');
    const firstPhase = phases[0];
    const topics = firstPhase
      ? await Topic.find({ phaseId: firstPhase._id, isActive: true })
        .select('title description estimatedTime theoryNotes theoryLink gfgLink documentationLink notesLink practiceLink youtubeLink checkpoints')
        .sort('order')
      : [];

    res.json({
      success: true,
      data: {
        domain,
        phases,
        freePhaseId: firstPhase?._id || null,
        freeTopics: topics.map((topic) => toGuestTopic(topic, domain.slug))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuestTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId)
      .select('phaseId domainId title description estimatedTime theoryNotes theoryLink gfgLink documentationLink notesLink practiceLink youtubeLink checkpoints isActive')
      .populate({ path: 'phaseId', select: 'domainId phaseNumber isActive' })
      .populate({ path: 'domainId', select: 'slug isActive' });

    if (
      !topic ||
      !topic.isActive ||
      !topic.phaseId?.isActive ||
      !topic.domainId?.isActive ||
      !AVAILABLE_SLUGS.includes(topic.domainId.slug) ||
      !topic.phaseId.domainId.equals(topic.domainId._id)
    ) {
      return res.status(404).json({ success: false, message: 'Guest learning material not found' });
    }

    const phases = await Phase.find({ domainId: topic.phaseId.domainId, isActive: true })
      .select('_id')
      .sort('phaseNumber');
    const firstPhase = phases[0];
    if (!firstPhase || !firstPhase._id.equals(topic.phaseId._id)) {
      return res.status(403).json({ success: false, message: 'Sign in to access this learning material' });
    }

    res.json({ success: true, data: toGuestTopic(topic, topic.domainId.slug) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
