const crypto = require('node:crypto');

const ARCHIVE_KEY_MODE = 'history-passphrase-scrypt-v1';
const ARCHIVE_KEY_CONTEXT = '中国河南省焦作市|LAT=35.25|LON=113.23|0722';

function deriveArchiveKey(secret, innerSalt) {
  if (String(secret).length < 4) throw new Error('历史密钥至少 4 位');
  if (!/^[a-f0-9]{48}$/i.test(String(innerSalt))) throw new Error('历史密钥盐值无效');
  const salt = crypto.createHash('sha256')
    .update('cn.dxr.gobsmacked.archive-key.v1\0', 'utf8')
    .update(Buffer.from(innerSalt, 'hex'))
    .digest();
  return crypto.scryptSync(`${String(secret)}\0${ARCHIVE_KEY_CONTEXT}`, salt, 32, {
    N: 1 << 17,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024
  });
}

function usesHistoryPassphrase(info) {
  return info?.keyProtection === ARCHIVE_KEY_MODE;
}

module.exports = {
  ARCHIVE_KEY_MODE,
  ARCHIVE_KEY_CONTEXT,
  deriveArchiveKey,
  usesHistoryPassphrase
};
