/* Minimal connectivity + topology test for Redis and RabbitMQ (maker) */
const Redis = require('ioredis');
const amqp = require('amqplib');

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@rabbitmq:5672';

const primaryQueues = [
  'maker.phase.complete',
  'maker.microtask.complete',
  'maker.microtask.failed',
  'maker.voting.complete',
  'maker.redflag.raised',
  'maker.rollback.requested',
  'maker.manual.review',
];

async function testRedis() {
  const redis = new Redis(REDIS_URL, { connectTimeout: 8000 });
  const ping = await redis.ping();
  console.log('[maker-test] Redis PING:', ping);

  const key = `maker:test:${Date.now()}`;
  await redis.set(key, 'ok', 'EX', 30);
  const val = await redis.get(key);
  console.log('[maker-test] Redis SET/GET:', val);
  await redis.quit();
}

async function testRabbitTopologyAndRoundtrip() {
  const conn = await amqp.connect(AMQP_URL);
  const ch = await conn.createChannel();

  // Assert exchanges used by EnhancedMessageQueue
  await ch.assertExchange('maker.events', 'topic', { durable: true });
  await ch.assertExchange('maker.dlx', 'topic', { durable: true });
  await ch.assertExchange('maker.retry', 'topic', { durable: true });

  // Assert primary queues and bindings
  for (const q of primaryQueues) {
    await ch.assertQueue(q, { durable: true });
    await ch.bindQueue(q, 'maker.events', q);
  }

  // Assert DLQ and bind to DLX
  await ch.assertQueue('maker.deadletter', { durable: true });
  await ch.bindQueue('maker.deadletter', 'maker.dlx', '#');

  // Assert retry queue and bind to retry exchange
  await ch.assertQueue('maker.retry.queue', { durable: true });
  await ch.bindQueue('maker.retry.queue', 'maker.retry', '#');

  // Round-trip on a primary queue
  const rk = 'maker.microtask.complete';
  const payload = { hello: 'world', ts: Date.now() };
  await ch.publish('maker.events', rk, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    headers: { 'x-retry-count': 0, 'x-original-routing-key': rk },
  });
  console.log('[maker-test] Published to maker.events with rk:', rk);

  const primaryMsg = await ch.get(rk, { noAck: false });
  if (!primaryMsg) throw new Error('No message on primary queue');
  console.log('[maker-test] Consumed from primary:', primaryMsg.content.toString());
  ch.ack(primaryMsg);

  // Round-trip on retry queue
  const retryPayload = { kind: 'retry', ts: Date.now() };
  await ch.publish(
    'maker.retry',
    rk,
    Buffer.from(JSON.stringify(retryPayload)),
    { persistent: true, headers: { 'x-retry-count': 1, 'x-original-routing-key': rk } }
  );
  console.log('[maker-test] Published to maker.retry');

  const retryMsg = await ch.get('maker.retry.queue', { noAck: true });
  if (!retryMsg) throw new Error('No message on retry queue');
  console.log('[maker-test] Consumed from retry:', retryMsg.content.toString());

  // Smoke test DLX: publish directly to DLX (for wiring confirmation)
  const dlxPayload = { kind: 'dlx-test', ts: Date.now() };
  await ch.publish('maker.dlx', 'any.route', Buffer.from(JSON.stringify(dlxPayload)), {
    persistent: true,
  });
  console.log('[maker-test] Published to maker.dlx');

  const dlqMsg = await ch.get('maker.deadletter', { noAck: true });
  if (!dlqMsg) throw new Error('No message on deadletter queue');
  console.log('[maker-test] Consumed from deadletter:', dlqMsg.content.toString());

  await ch.close();
  await conn.close();
}

(async () => {
  try {
    await testRedis();
    await testRabbitTopologyAndRoundtrip();
    console.log('[maker-test] SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('[maker-test] FAILURE:', err.message);
    process.exit(1);
  }
})();
