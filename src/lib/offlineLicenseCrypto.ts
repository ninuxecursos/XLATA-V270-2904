/**
 * Offline License Crypto (browser)
 *
 * Formato do arquivo `license.xlata`:
 *   XLATA1\n<base64( 16-byte salt | 12-byte iv | ciphertext+gcm-tag | 32-byte hmac )>
 *
 * Ciframos o JSON da licença com AES-256-GCM (chave derivada via SHA-256 a partir
 * de salt + master) e assinamos o blob inteiro (salt|iv|ct) com HMAC-SHA256
 * (chave derivada via SHA-256 com master + sufixo "::hmac").
 *
 * O master secret é compartilhado com `server.js` no template offline.
 * NÃO é segurança militar — o objetivo é IMPEDIR edição manual em bloco de
 * notas (o atacante teria que recompilar o servidor, o que já é trivialmente
 * "atacante avançado"). Para o contexto de licença offline isso é suficiente.
 */
import type { OfflineLicensePayload } from './offlineLicenseSecret';
import { OFFLINE_LICENSE_MASTER_SECRET, MAGIC } from './offlineLicenseSecret';

const enc = new TextEncoder();
const dec = new TextDecoder();

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return new Uint8Array(buf);
}

async function deriveAesKey(salt: Uint8Array): Promise<CryptoKey> {
  const material = new Uint8Array(salt.length + OFFLINE_LICENSE_MASTER_SECRET.length);
  material.set(salt, 0);
  material.set(enc.encode(OFFLINE_LICENSE_MASTER_SECRET), salt.length);
  const raw = await sha256(material);
  return crypto.subtle.importKey('raw', raw as unknown as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function deriveHmacKey(): Promise<CryptoKey> {
  const raw = await sha256(enc.encode(OFFLINE_LICENSE_MASTER_SECRET + '::hmac'));
  return crypto.subtle.importKey('raw', raw as unknown as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptLicense(payload: OfflineLicensePayload): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(salt);
  const plaintext = enc.encode(JSON.stringify(payload));
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, aesKey, plaintext as unknown as BufferSource);
  const ct = new Uint8Array(ctBuf);

  // Body to authenticate = salt | iv | ct (ct already includes GCM tag)
  const body = new Uint8Array(salt.length + iv.length + ct.length);
  body.set(salt, 0);
  body.set(iv, salt.length);
  body.set(ct, salt.length + iv.length);

  const hmacKey = await deriveHmacKey();
  const sigBuf = await crypto.subtle.sign('HMAC', hmacKey, body as unknown as BufferSource);
  const sig = new Uint8Array(sigBuf); // 32 bytes

  const blob = new Uint8Array(body.length + sig.length);
  blob.set(body, 0);
  blob.set(sig, body.length);

  const text = MAGIC + '\n' + bytesToBase64(blob);
  return enc.encode(text);
}

export async function decryptLicense(file: Uint8Array | string): Promise<OfflineLicensePayload> {
  const text = typeof file === 'string' ? file : dec.decode(file);
  const trimmed = text.trim();
  if (!trimmed.startsWith(MAGIC)) throw new Error('Formato de licença inválido (magic ausente)');
  const b64 = trimmed.slice(MAGIC.length).trim();
  const blob = base64ToBytes(b64);
  if (blob.length < 16 + 12 + 16 + 32) throw new Error('Licença corrompida');

  const sig = blob.slice(blob.length - 32);
  const body = blob.slice(0, blob.length - 32);
  const hmacKey = await deriveHmacKey();
  const ok = await crypto.subtle.verify('HMAC', hmacKey, sig as unknown as BufferSource, body as unknown as BufferSource);
  if (!ok) throw new Error('Assinatura HMAC inválida — licença adulterada');

  const salt = body.slice(0, 16);
  const iv = body.slice(16, 28);
  const ct = body.slice(28);

  const aesKey = await deriveAesKey(salt);
  const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, aesKey, ct as unknown as BufferSource);
  const json = dec.decode(new Uint8Array(ptBuf));
  return JSON.parse(json) as OfflineLicensePayload;
}
