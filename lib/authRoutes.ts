export type AppUserType = 'customer' | 'vendor' | 'rider';

export function normalizeUserType(value: unknown): AppUserType | null {
  return value === 'vendor' || value === 'rider' || value === 'customer'
    ? value
    : null;
}

export function getHomeRoute(userType: unknown) {
  const normalized = normalizeUserType(userType) ?? 'customer';
  return normalized === 'vendor' ? '/(tabs)/vendor-orders' : '/(tabs)';
}
