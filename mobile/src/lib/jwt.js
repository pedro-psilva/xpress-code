// Lê o campo `sub` (id do usuário) do payload do JWT. NÃO valida a assinatura
// — isso é responsabilidade do backend; aqui só precisamos do id para a UI
// (ex.: o cliente agenda para si mesmo). Decodifica base64url sem depender de
// `atob`, garantindo o mesmo comportamento em web e mobile (Hermes).
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function userIdFromToken(token) {
  return decodePayload(token)?.sub ?? null;
}

function decodePayload(token) {
  if (!token) return null;
  try {
    const segmento = token.split('.')[1];
    if (!segmento) return null;
    return JSON.parse(decodeBase64Url(segmento));
  } catch {
    return null;
  }
}

function decodeBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  let bits = '';
  let texto = '';

  for (const caractere of base64) {
    if (caractere === '=') break;
    const valor = BASE64_CHARS.indexOf(caractere);
    if (valor === -1) continue;
    bits += valor.toString(2).padStart(6, '0');
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    texto += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }

  return texto;
}
