
async function test() {
  const res = await fetch('https://devpost.com/hackathons');
  const text = await res.text();
  console.log('HTML size:', text.length);
  const regex = /data-role="hackathon-title">([^<]+)/g;
  let match;
  let count = 0;
  while ((match = regex.exec(text)) !== null && count < 5) {
    console.log(match[1].trim());
    count++;
  }
}
test();

