const test = require('node:test');
const assert = require('node:assert/strict');
const { trustTokenHash, isDeviceTrusted, addTrustedDevice, removeTrustedDevice } = require('../src/trust.cjs');

test('本机信任凭证只以哈希写入信任名单', () => {
  const device = { id: 'device-1', token: 'private-token' };
  const config = addTrustedDevice({ identity: 'owner' }, device, '本机', '2026-08-21T00:00:00.000Z');
  assert.equal(config.trustedDevices[0].tokenHash, trustTokenHash(device.token));
  assert.equal(JSON.stringify(config).includes(device.token), false);
  assert.equal(isDeviceTrusted(config, device), true);
  assert.equal(isDeviceTrusted(config, { ...device, token: 'wrong-token' }), false);
});

test('移出信任名单后本机凭证不能直接进入', () => {
  const device = { id: 'device-1', token: 'private-token' };
  const trusted = addTrustedDevice({}, device, '本机');
  const removed = removeTrustedDevice(trusted, device.id);
  assert.equal(isDeviceTrusted(removed, device), false);
});
