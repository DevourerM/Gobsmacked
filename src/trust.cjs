const crypto = require('node:crypto');

function trustTokenHash(token) {
  return crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function safeHashEqual(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(String(left)) || !/^[a-f0-9]{64}$/i.test(String(right))) return false;
  const leftBytes = Buffer.from(left, 'hex');
  const rightBytes = Buffer.from(right, 'hex');
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

function isDeviceTrusted(config, device) {
  if (!device?.id || !device?.token || !Array.isArray(config?.trustedDevices)) return false;
  const entry = config.trustedDevices.find((item) => item?.id === device.id);
  return Boolean(entry && safeHashEqual(entry.tokenHash, trustTokenHash(device.token)));
}

function addTrustedDevice(config, device, name, timestamp = new Date().toISOString()) {
  const existing = Array.isArray(config?.trustedDevices) ? config.trustedDevices : [];
  const trustedDevices = existing.filter((item) => item?.id && item.id !== device.id).slice(-19);
  trustedDevices.push({
    id: String(device.id).slice(0, 100),
    name: String(name || 'This device').slice(0, 100),
    tokenHash: trustTokenHash(device.token),
    trustedAt: timestamp
  });
  return { ...config, version: Math.max(3, Number(config?.version) || 0), trustedDevices };
}

function removeTrustedDevice(config, deviceId) {
  return {
    ...config,
    version: Math.max(3, Number(config?.version) || 0),
    trustedDevices: (Array.isArray(config?.trustedDevices) ? config.trustedDevices : []).filter((item) => item?.id !== deviceId)
  };
}

module.exports = { trustTokenHash, isDeviceTrusted, addTrustedDevice, removeTrustedDevice };
