// Launch lineup only. Curriculum IDs and stored progress remain unchanged.
const launchedDomains = new Set(['dsa', 'web-development']);
export function isDomainAvailable(domain) {
  return Boolean(domain?._id && launchedDomains.has(domain.slug) && domain.isActive !== false);
}
export function partitionDomains(domains) {
  return {
    available: domains.filter(isDomainAvailable),
    upcoming: domains.filter((domain) => !isDomainAvailable(domain)),
  };
}
