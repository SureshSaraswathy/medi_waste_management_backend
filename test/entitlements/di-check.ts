/* Dependency-injection shape check: a Global module that imports the auth module (like EntitlementModule) provides
 * CHANNEL_LOGIN_POLICY via useExisting, and a provider inside the auth module receives it through @Optional @Inject.
 * Mirrors the real wiring (AuthModule does NOT import EntitlementModule: no import cycle). */
import 'reflect-metadata';
import { Global, Inject, Injectable, Module, Optional } from '@nestjs/common';
import { Test } from '@nestjs/testing';
const D = process.env.DIST as string;
const { CHANNEL_LOGIN_POLICY } = require(D + '/modules/auth/application/channel-login-policy');

@Injectable() class AuthJwtLike { who = 'jwt'; }
@Injectable() class LoginLike { constructor(@Optional() @Inject(CHANNEL_LOGIN_POLICY) public readonly policy?: any) {} }
@Module({ providers: [AuthJwtLike, LoginLike], exports: [AuthJwtLike, LoginLike] }) class AuthLikeModule {}
@Injectable() class EntLike { constructor(public readonly jwt: AuthJwtLike) {} assertChannelAllowed() { return Promise.resolve(); } }
@Global() @Module({ imports: [AuthLikeModule], providers: [EntLike, { provide: CHANNEL_LOGIN_POLICY, useExisting: EntLike }], exports: [EntLike, CHANNEL_LOGIN_POLICY] }) class EntLikeModule {}
@Module({ imports: [AuthLikeModule, EntLikeModule] }) class AppLike {}
@Module({ imports: [AuthLikeModule] }) class AuthOnly {}

(async () => {
  const app = await Test.createTestingModule({ imports: [AppLike] }).compile();
  const login = app.get(LoginLike, { strict: false });
  const ent = app.get(EntLike, { strict: false });
  console.log(login.policy === ent && ent.jwt instanceof AuthJwtLike ? 'PASS global module provides the policy to a provider inside the auth module (no import cycle)' : 'FAIL policy not injected');
  const bare = await Test.createTestingModule({ imports: [AuthOnly] }).compile();
  console.log(bare.get(LoginLike, { strict: false }).policy === undefined ? 'PASS without the entitlement module the policy is simply absent (logins unaffected)' : 'FAIL');
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
