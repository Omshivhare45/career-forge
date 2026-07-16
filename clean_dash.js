const fs = require('fs');
const path = 'client/src/pages/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Zero to Coding, Certifications, Continue Learning
const idx1 = content.indexOf('      {/* Zero to Coding Arcade Invitation Card (GFG Bright Theme) */}');
const idx2 = content.indexOf('      <div className="grid lg:grid-cols-3 gap-8 mb-10">');
if (idx1 !== -1 && idx2 !== -1) {
  content = content.slice(0, idx1) + content.slice(idx2);
}

// 2. Remove bottom section (Grid lg:grid-cols-2) and Modals
const idx3 = content.indexOf('      <div className="grid lg:grid-cols-2 gap-8">');
const idx4 = content.lastIndexOf('    </div>');
if (idx3 !== -1 && idx4 !== -1) {
  content = content.slice(0, idx3) + content.slice(idx4);
}

// 3. Remove unused state variables
content = content.replace(/  const \[certificates, setCertificates\] = useState\(\[\]\);\n/, '');
content = content.replace(/  const \[selectedCertificate, setSelectedCertificate\] = useState\(null\);\n/, '');
content = content.replace(/  const \[allBadges, setAllBadges\] = useState\(\[\]\);\n/, '');
content = content.replace(/  const \[selectedBadge, setSelectedBadge\] = useState\(null\);\n/, '');
content = content.replace(/  const \[activeBadgeTab, setActiveBadgeTab\] = useState\('unlocked'\);\n/, '');

// 4. Clean up fetchDashboard
content = content.replace(/      const certRes = await api\.get\('\/certificates\/my'\);\n      setCertificates\(certRes\.data\.data\);\n\n      const badgesRes = await api\.get\('\/badges'\);\n      setAllBadges\(badgesRes\.data\.data \|\| \[\]\);\n/, '');

// 5. Clean up logic block (getLastNDays to upcomingAchievements)
const logicStart = content.indexOf('  const getLastNDays = (n) => {');
const logicEnd = content.indexOf('  return (');
if (logicStart !== -1 && logicEnd !== -1) {
  content = content.slice(0, logicStart) + content.slice(logicEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Dashboard cleaned successfully.");
