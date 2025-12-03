// Simple sanity runner that requires the enhanced module from the bind mount
const {
  ConnectionPoolManager,
  CacheManager,
  Logger,
  EnhancedRedisStateManager,
  EnhancedMessageQueue,
} = require('/opt/enhanced-maker/enhanced-maker.js');

(async () => {
  const logger = new Logger('info');
  const cache = new CacheManager(30000, 100);

  const config = {
    redis_url: process.env.REDIS_URL || 'redis://redis:6379',
    message_queue_url: process.env.MESSAGE_QUEUE_URL || 'amqp://guest:guest@rabbitmq:5672',
  };

  const pool = new ConnectionPoolManager(config);
  const state = new EnhancedRedisStateManager(config, pool, logger, cache);
  const mq = new EnhancedMessageQueue(config, pool, logger);

  const executionId = 'runner-' + Math.random().toString(36).slice(2, 8);

  const s0 = await state.loadState(executionId);
  console.log('Loaded default state keys:', Object.keys(s0).slice(0, 5));

  s0.metadata.runner = 'ok';
  await state.saveState(s0);
  console.log('Saved state version:', s0.version);

  await mq.publish('maker.microtask.complete', { executionId, note: 'hello from runner' });
  console.log('Published message to maker.microtask.complete');

  await state.close();
  await mq.close();
  process.exit(0);
})().catch((err) => {
  console.error('Runner error:', err && err.message, err && err.stack);
  process.exit(1);
});
