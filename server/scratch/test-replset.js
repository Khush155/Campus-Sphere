const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function test() {
  try {
    console.log('Starting replica set...');
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    console.log('URI:', replSet.getUri());
    await replSet.stop();
    console.log('Success!');
  } catch (err) {
    console.error('Failed:', err);
  }
}

test();
