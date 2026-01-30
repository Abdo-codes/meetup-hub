// MD5 hash implementation for Gravatar (WordPress image service)
function md5(str: string): string {
  function rotateLeft(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
  function addUnsigned(x: number, y: number) {
    const x8 = x & 0x80000000, y8 = y & 0x80000000;
    const x4 = x & 0x40000000, y4 = y & 0x40000000;
    const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) return result & 0x40000000 ? result ^ 0xC0000000 ^ x8 ^ y8 : result ^ 0x40000000 ^ x8 ^ y8;
    return result ^ x8 ^ y8;
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b); }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b); }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b); }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b); }
  function convertToWordArray(str: string) {
    const len = str.length, numWords = ((len + 8 - ((len + 8) % 64)) / 64 + 1) * 16;
    const arr: number[] = Array(numWords - 1).fill(0);
    let pos = 0;
    for (let i = 0; i < len; i++) { arr[(i - i % 4) / 4] |= str.charCodeAt(i) << ((i % 4) * 8); pos = i; }
    arr[(pos - pos % 4) / 4] |= 0x80 << ((pos % 4) * 8);
    arr[numWords - 2] = len << 3; arr[numWords - 1] = len >>> 29;
    return arr;
  }
  function wordToHex(val: number) {
    let str = "", temp;
    for (let i = 0; i <= 3; i++) { temp = (val >>> (i * 8)) & 255; str += ("0" + temp.toString(16)).slice(-2); }
    return str;
  }
  const x = convertToWordArray(str);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const T = [0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE, 0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501, 0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE, 0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821, 0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA, 0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8, 0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED, 0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A, 0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C, 0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70, 0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05, 0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665, 0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039, 0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1, 0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1, 0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391];
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k], S[0], T[0]); d = FF(d, a, b, c, x[k + 1], S[1], T[1]); c = FF(c, d, a, b, x[k + 2], S[2], T[2]); b = FF(b, c, d, a, x[k + 3], S[3], T[3]);
    a = FF(a, b, c, d, x[k + 4], S[0], T[4]); d = FF(d, a, b, c, x[k + 5], S[1], T[5]); c = FF(c, d, a, b, x[k + 6], S[2], T[6]); b = FF(b, c, d, a, x[k + 7], S[3], T[7]);
    a = FF(a, b, c, d, x[k + 8], S[0], T[8]); d = FF(d, a, b, c, x[k + 9], S[1], T[9]); c = FF(c, d, a, b, x[k + 10], S[2], T[10]); b = FF(b, c, d, a, x[k + 11], S[3], T[11]);
    a = FF(a, b, c, d, x[k + 12], S[0], T[12]); d = FF(d, a, b, c, x[k + 13], S[1], T[13]); c = FF(c, d, a, b, x[k + 14], S[2], T[14]); b = FF(b, c, d, a, x[k + 15], S[3], T[15]);
    a = GG(a, b, c, d, x[k + 1], S[4], T[16]); d = GG(d, a, b, c, x[k + 6], S[5], T[17]); c = GG(c, d, a, b, x[k + 11], S[6], T[18]); b = GG(b, c, d, a, x[k], S[7], T[19]);
    a = GG(a, b, c, d, x[k + 5], S[4], T[20]); d = GG(d, a, b, c, x[k + 10], S[5], T[21]); c = GG(c, d, a, b, x[k + 15], S[6], T[22]); b = GG(b, c, d, a, x[k + 4], S[7], T[23]);
    a = GG(a, b, c, d, x[k + 9], S[4], T[24]); d = GG(d, a, b, c, x[k + 14], S[5], T[25]); c = GG(c, d, a, b, x[k + 3], S[6], T[26]); b = GG(b, c, d, a, x[k + 8], S[7], T[27]);
    a = GG(a, b, c, d, x[k + 13], S[4], T[28]); d = GG(d, a, b, c, x[k + 2], S[5], T[29]); c = GG(c, d, a, b, x[k + 7], S[6], T[30]); b = GG(b, c, d, a, x[k + 12], S[7], T[31]);
    a = HH(a, b, c, d, x[k + 5], S[8], T[32]); d = HH(d, a, b, c, x[k + 8], S[9], T[33]); c = HH(c, d, a, b, x[k + 11], S[10], T[34]); b = HH(b, c, d, a, x[k + 14], S[11], T[35]);
    a = HH(a, b, c, d, x[k + 1], S[8], T[36]); d = HH(d, a, b, c, x[k + 4], S[9], T[37]); c = HH(c, d, a, b, x[k + 7], S[10], T[38]); b = HH(b, c, d, a, x[k + 11], S[11], T[39]);
    a = HH(a, b, c, d, x[k + 13], S[8], T[40]); d = HH(d, a, b, c, x[k], S[9], T[41]); c = HH(c, d, a, b, x[k + 3], S[10], T[42]); b = HH(b, c, d, a, x[k + 6], S[11], T[43]);
    a = HH(a, b, c, d, x[k + 9], S[8], T[44]); d = HH(d, a, b, c, x[k + 12], S[9], T[45]); c = HH(c, d, a, b, x[k + 15], S[10], T[46]); b = HH(b, c, d, a, x[k + 2], S[11], T[47]);
    a = II(a, b, c, d, x[k], S[12], T[48]); d = II(d, a, b, c, x[k + 7], S[13], T[49]); c = II(c, d, a, b, x[k + 14], S[14], T[50]); b = II(b, c, d, a, x[k + 5], S[15], T[51]);
    a = II(a, b, c, d, x[k + 12], S[12], T[52]); d = II(d, a, b, c, x[k + 3], S[13], T[53]); c = II(c, d, a, b, x[k + 10], S[14], T[54]); b = II(b, c, d, a, x[k + 1], S[15], T[55]);
    a = II(a, b, c, d, x[k + 8], S[12], T[56]); d = II(d, a, b, c, x[k + 15], S[13], T[57]); c = II(c, d, a, b, x[k + 6], S[14], T[58]); b = II(b, c, d, a, x[k + 13], S[15], T[59]);
    a = II(a, b, c, d, x[k + 4], S[12], T[60]); d = II(d, a, b, c, x[k + 11], S[13], T[61]); c = II(c, d, a, b, x[k + 2], S[14], T[62]); b = II(b, c, d, a, x[k + 9], S[15], T[63]);
    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

/**
 * Generate Gravatar URL (WordPress image service) from email
 * Uses proper MD5 hash as required by Gravatar
 * Falls back to "identicon" - unique geometric patterns based on email hash
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
