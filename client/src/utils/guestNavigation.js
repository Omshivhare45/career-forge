const browsePaths = [
  /^\/(?:dashboard|domains|roadmap|ide|academics)\/?$/,
  /^\/topic\/[\w-]+\/?$/,
  /^\/academics\/(?:chapter|subject)\/[\w-]+\/?$/,
  /^\/academics\/subjects\/[\w-]+\/[\w-]+\/?$/,
];
const accountPaths = /^\/(?:setup-profile|assessments|code-guru|resources|career-guide|jobs|zero-to-coding|profile|feedback)\/?$/;
const adminPaths = /^\/admin(?:\/(?:users|submissions|topics|academics|problems(?:\/create|\/(?:edit|test-cases)\/[\w-]+)?))?\/?$/;

export function validatedReturnPath(path, role) {
  if (typeof path !== 'string' || !path.startsWith('/') || /[\\\u0000-\u0020\u007f]/.test(path)) return null;
  const pathname = path.split(/[?#]/, 1)[0];
  if (browsePaths.some((pattern) => pattern.test(pathname))) return path;
  if (['student', 'admin'].includes(role) && accountPaths.test(pathname)) return path;
  if (role === 'admin' && adminPaths.test(pathname)) return path;
  return null;
}

export function loginPath({ pathname, search = '', hash = '' }) {
  return '/login?' + new URLSearchParams({ next: pathname + search + hash });
}

export function loginDestination(next, user) {
  return validatedReturnPath(next, user.role) ||
    (user.role === 'admin' ? '/admin' : user.activeDomain || user.selectedDomain ? '/dashboard' : '/domains');
}

export function roadmapPath(domainId) {
  return domainId ? '/roadmap?' + new URLSearchParams({ domain: domainId }) : '/roadmap';
}
