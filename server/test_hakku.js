
async function test() {
  try {
    const res = await fetch('https://tryhakku.vercel.app/');
    const text = await res.text();
    console.log('HTML size:', text.length);
    // Print first 500 chars to see what it is
    console.log(text.substring(0, 500));
  } catch(e) { console.error('Failed:', e); }
}
test();

