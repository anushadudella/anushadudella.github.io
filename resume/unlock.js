const form = document.getElementById('unlock');
const input = document.getElementById('password');
const submit = document.getElementById('submit');
const status = document.getElementById('status');
const gate = document.getElementById('gate');
const viewer = document.getElementById('viewer');
let objectURL;
const bytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!crypto.subtle) { status.textContent = 'Please open this page over HTTPS in a modern browser.'; return; }
  submit.disabled = true;
  status.textContent = 'Opening resume…';
  let payload;
  try {
    const response = await fetch('./document.json');
    if (!response.ok) throw new Error('Download failed');
    payload = await response.json();
  } catch {
    status.textContent = 'Could not load the resume. Please try again.';
    submit.disabled = false;
    return;
  }
  try {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:bytes(payload.salt), iterations:payload.iterations, hash:'SHA-256'}, material, {name:'AES-GCM', length:256}, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes(payload.iv)}, key, bytes(payload.data));
    objectURL = URL.createObjectURL(new Blob([decrypted], {type:'application/pdf'}));
    document.getElementById('pdf').src = objectURL;
    document.getElementById('download').href = objectURL;
    input.value = '';
    status.textContent = '';
    gate.hidden = true;
    viewer.hidden = false;
    document.getElementById('download').focus();
  } catch {
    status.textContent = 'Incorrect password. Please try again.';
    input.value = '';
    input.focus();
  } finally { submit.disabled = false; }
});

document.getElementById('lock').addEventListener('click', () => {
  document.getElementById('pdf').removeAttribute('src');
  document.getElementById('download').removeAttribute('href');
  if (objectURL) URL.revokeObjectURL(objectURL);
  objectURL = undefined;
  viewer.hidden = true;
  gate.hidden = false;
  input.focus();
});
window.addEventListener('pagehide', () => { if (objectURL) URL.revokeObjectURL(objectURL); });
