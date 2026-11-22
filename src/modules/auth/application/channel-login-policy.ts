/**
 * Customer Entitlements: a customer's Mobile App and HCF Portal are licensed separately. The auth use cases ask this
 * policy BEFORE a token is issued, so a disabled channel is refused at login (not only on the first API call).
 * The implementation lives in the entitlement module (global provider); the token keeps the auth module free of an
 * import cycle. When no implementation is provided (or licensing mode is not ENFORCE) logins are unaffected.
 */
export const CHANNEL_LOGIN_POLICY = 'CHANNEL_LOGIN_POLICY';

export type LoginChannelFeature = 'MOBILE_APP' | 'HCF_PORTAL';

export interface ChannelLoginPolicy {
  /** Throws 403 FEATURE_NOT_LICENSED (ENFORCE) or records a shadow event (SHADOW). Never called for SuperAdmin. */
  assertChannelAllowed(companyId: string | null | undefined, feature: LoginChannelFeature, who?: { userId?: string | null; route?: string }): Promise<void>;
}
