import {
  anyEffective, Catalogue, CatalogueNode, effectiveSets, isCore, isEffective, isSuperAdminUser, normalizeRoute, planChanges, StoredFlags, validateChanges,
} from './entitlement.rules';

const n = (code: string, type: CatalogueNode['type'], parent: string | null, extra: Partial<CatalogueNode> = {}): CatalogueNode => ({
  code, type, name: code, parent, core: false, active: true, sort: 1, ...extra,
});

// DASH (core) > DASH.HOME > DASH.HOME.VIEW ; FIN > FIN.INV > FIN.INV.{VIEW,PDF} ; FIN > FIN.PAY > FIN.PAY.VIEW ; MOB (separate module)
const cat = new Catalogue([
  n('DASH', 'MODULE', null, { core: true }), n('DASH.HOME', 'SUBMODULE', 'DASH'), n('DASH.HOME.VIEW', 'FEATURE', 'DASH.HOME'),
  n('FIN', 'MODULE', null), n('FIN.INV', 'SUBMODULE', 'FIN'), n('FIN.INV.VIEW', 'FEATURE', 'FIN.INV'), n('FIN.INV.PDF', 'FEATURE', 'FIN.INV'),
  n('FIN.PAY', 'SUBMODULE', 'FIN'), n('FIN.PAY.VIEW', 'FEATURE', 'FIN.PAY'),
  n('MOB', 'MODULE', null), n('MOB.HOME', 'SUBMODULE', 'MOB'), n('MOB.HOME.VIEW', 'FEATURE', 'MOB.HOME'),
  n('OLD', 'MODULE', null, { active: false }), n('OLD.X', 'SUBMODULE', 'OLD'),
]);
const flags = (obj: Record<string, boolean>): StoredFlags => new Map(Object.entries(obj));
const ALL_ON = flags({ FIN: true, 'FIN.INV': true, 'FIN.INV.VIEW': true, 'FIN.INV.PDF': true, 'FIN.PAY': true, 'FIN.PAY.VIEW': true });

describe('entitlement rules: effective access', () => {
  it('a missing row means disabled', () => {
    expect(isEffective(cat, flags({}), 'FIN')).toBe(false);
    expect(isEffective(cat, flags({}), 'FIN.INV.VIEW')).toBe(false);
  });

  it('enabled module, submodule and feature are effective', () => {
    expect(isEffective(cat, ALL_ON, 'FIN.INV.PDF')).toBe(true);
  });

  it('a feature needs its submodule AND its module enabled', () => {
    expect(isEffective(cat, flags({ 'FIN.INV.VIEW': true }), 'FIN.INV.VIEW')).toBe(false);
    expect(isEffective(cat, flags({ FIN: true, 'FIN.INV.VIEW': true }), 'FIN.INV.VIEW')).toBe(false);
    expect(isEffective(cat, flags({ FIN: true, 'FIN.INV': true, 'FIN.INV.VIEW': true }), 'FIN.INV.VIEW')).toBe(true);
  });

  it('features are independent of each other while the parent is on', () => {
    const f = flags({ ...Object.fromEntries(ALL_ON), 'FIN.INV.PDF': false });
    expect(isEffective(cat, f, 'FIN.INV.VIEW')).toBe(true);
    expect(isEffective(cat, f, 'FIN.INV.PDF')).toBe(false);
  });

  it('switching a parent off disables every child without changing the children\'s stored flags', () => {
    const f = new Map(ALL_ON);
    const before = JSON.stringify([...f.entries()]);
    f.set('FIN', false);
    expect(isEffective(cat, f, 'FIN.INV.VIEW')).toBe(false);
    expect(isEffective(cat, f, 'FIN.PAY.VIEW')).toBe(false);
    // nothing but the parent flag changed: the children's own choices are still stored
    expect(f.get('FIN.INV.VIEW')).toBe(true);
    expect(f.get('FIN.INV')).toBe(true);
    expect(JSON.stringify([...f.entries()]).replace('["FIN",false]', '["FIN",true]')).toBe(before);
  });

  it('switching the parent back on restores the previous child settings exactly', () => {
    const f = new Map(Object.entries({ ...Object.fromEntries(ALL_ON), 'FIN.INV.PDF': false, 'FIN.PAY': false }));
    const effectiveBefore = effectiveSets(cat, f);
    f.set('FIN', false);
    expect(effectiveSets(cat, f).features).not.toContain('FIN.INV.VIEW');
    f.set('FIN', true);
    expect(effectiveSets(cat, f)).toEqual(effectiveBefore); // identical to before the parent was switched off
    expect(isEffective(cat, f, 'FIN.INV.PDF')).toBe(false); // the earlier "off" choice survived
    expect(isEffective(cat, f, 'FIN.PAY.VIEW')).toBe(false); // and so did the disabled submodule
  });

  it('submodule off disables its features but not its siblings', () => {
    const f = new Map(ALL_ON); f.set('FIN.INV', false);
    expect(isEffective(cat, f, 'FIN.INV.VIEW')).toBe(false);
    expect(isEffective(cat, f, 'FIN.PAY.VIEW')).toBe(true);
  });

  it('core items are always effective, with no rows at all', () => {
    expect(isCore(cat, 'DASH.HOME.VIEW')).toBe(true);
    expect(isEffective(cat, flags({}), 'DASH')).toBe(true);
    expect(isEffective(cat, flags({}), 'DASH.HOME.VIEW')).toBe(true);
    expect(isEffective(cat, flags({ DASH: false }), 'DASH.HOME.VIEW')).toBe(true); // even a stray false row cannot lock core out
  });

  it('a retired (inactive) catalogue item is never effective', () => {
    expect(isEffective(cat, flags({ OLD: true, 'OLD.X': true }), 'OLD.X')).toBe(false);
  });

  it('an unknown code is never effective', () => {
    expect(isEffective(cat, ALL_ON, 'NOPE.NOPE')).toBe(false);
  });

  it('modules are independent of each other (Mobile App does not follow Finance)', () => {
    const f = flags({ MOB: true, 'MOB.HOME': true, 'MOB.HOME.VIEW': true });
    expect(isEffective(cat, f, 'MOB.HOME.VIEW')).toBe(true);
    expect(isEffective(cat, f, 'FIN.INV.VIEW')).toBe(false);
  });

  it('ANY-OF is entitled when at least one item is effective, and ignores unknown codes', () => {
    const f = flags({ FIN: true, 'FIN.PAY': true, 'FIN.PAY.VIEW': true });
    expect(anyEffective(cat, f, ['FIN.INV.VIEW', 'FIN.PAY.VIEW'])).toBe(true);
    expect(anyEffective(cat, f, ['FIN.INV.VIEW', 'FIN.INV.PDF'])).toBe(false);
    expect(anyEffective(cat, f, ['NOPE', 'FIN.PAY.VIEW'])).toBe(true);
    expect(anyEffective(cat, f, [])).toBe(false);
  });

  it('effectiveSets lists only what is enabled, core included', () => {
    const s = effectiveSets(cat, flags({ FIN: true, 'FIN.INV': true, 'FIN.INV.VIEW': true }));
    expect(s.modules).toEqual(['DASH', 'FIN']);
    expect(s.submodules).toEqual(['DASH.HOME', 'FIN.INV']);
    expect(s.features).toEqual(['DASH.HOME.VIEW', 'FIN.INV.VIEW']);
  });
});

describe('entitlement rules: validating and planning changes', () => {
  it('rejects unknown codes, duplicates and bad values', () => {
    const e = validateChanges(cat, [{ code: 'NOPE', enabled: true }, { code: 'FIN', enabled: true }, { code: 'FIN', enabled: false }, { code: 'FIN.INV', enabled: 'yes' as any }]);
    expect(e.map((x) => x.error)).toEqual(['UNKNOWN_CODE', 'DUPLICATE', 'INVALID_VALUE']);
  });

  it('refuses to disable a core module, submodule or feature, but allows enabling it (a no-op)', () => {
    expect(validateChanges(cat, [{ code: 'DASH', enabled: false }])[0].error).toBe('CORE_LOCKED');
    expect(validateChanges(cat, [{ code: 'DASH.HOME', enabled: false }])[0].error).toBe('CORE_LOCKED');
    expect(validateChanges(cat, [{ code: 'DASH.HOME.VIEW', enabled: false }])[0].error).toBe('CORE_LOCKED');
    expect(validateChanges(cat, [{ code: 'DASH', enabled: true }])).toEqual([]);
  });

  it('allows enabling a child while its parent is off (the choice is stored for later)', () => {
    expect(validateChanges(cat, [{ code: 'FIN.INV.VIEW', enabled: true }])).toEqual([]);
  });

  it('plans a row for an item that has none, even when the value is false, so the NEW marker clears', () => {
    const plan = planChanges(cat, flags({}), [{ code: 'FIN', enabled: false }]);
    expect(plan).toEqual([{ code: 'FIN', type: 'MODULE', oldValue: null, newValue: false }]);
  });

  it('skips unchanged values, plans real changes with old and new values, and never writes core', () => {
    const plan = planChanges(cat, ALL_ON, [
      { code: 'FIN', enabled: true },            // unchanged
      { code: 'FIN.INV.PDF', enabled: false },   // changed
      { code: 'DASH', enabled: true },           // core: never written
    ]);
    expect(plan).toEqual([{ code: 'FIN.INV.PDF', type: 'FEATURE', oldValue: true, newValue: false }]);
  });
});

describe('super administrator detection', () => {
  const cfg = { userId: 'sa-id', email: 'root@x.io', username: 'superadmin' };
  it('matches by user id, configured email or username', () => {
    expect(isSuperAdminUser({ userId: 'sa-id' }, cfg)).toBe(true);
    expect(isSuperAdminUser({ userId: '00000000-0000-0000-0000-000000000001' }, cfg)).toBe(true);
    expect(isSuperAdminUser({ userId: 'u', email: 'ROOT@x.io' }, cfg)).toBe(true);
    expect(isSuperAdminUser({ userId: 'u', userName: 'SuperAdmin' }, cfg)).toBe(true);
  });
  it('never treats a normal admin or a wildcard-permission user as SuperAdmin', () => {
    expect(isSuperAdminUser({ userId: 'u', userName: 'admin', permissions: ['*'] }, cfg)).toBe(false);
    expect(isSuperAdminUser(null, cfg)).toBe(false);
  });
});

describe('route normalisation', () => {
  it('strips the global api prefix', () => {
    expect(normalizeRoute('/api/v1/invoices/:id')).toBe('/invoices/:id');
    expect(normalizeRoute('/api/v12/x')).toBe('/x');
    expect(normalizeRoute('/invoices')).toBe('/invoices');
  });
});
