// Minimal n8n node wrapper around EnhancedRedisStateManager and EnhancedMessageQueue
// Loads the implementation from a bind-mounted path inside the container.

const enhancedLibPath = '/opt/enhanced-maker/enhanced-maker.js';
const {
  ConnectionPoolManager,
  CacheManager,
  Logger,
  EnhancedRedisStateManager,
  EnhancedMessageQueue,
} = require(enhancedLibPath);

// Helper to accept both objects and JSON strings
class EnhancedMaker {
  constructor() {
    this.description = {
      displayName: 'Enhanced Maker',
      name: 'enhancedMaker',
      icon: 'fa:gears',
      group: ['transform'],
      version: 1,
      description: 'Redis + RabbitMQ helpers for Enhanced Maker',
      defaults: { name: 'Enhanced Maker' },
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          displayName: 'Resource',
          name: 'resource',
          type: 'options',
          options: [
            { name: 'State', value: 'state' },
            { name: 'Queue', value: 'queue' },
          ],
          default: 'state',
        },
        // State operations
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          displayOptions: { show: { resource: ['state'] } },
          options: [
            { name: 'Load', value: 'load' },
            { name: 'Save', value: 'save' },
          ],
          default: 'load',
        },
        {
          displayName: 'Execution ID',
          name: 'executionId',
          type: 'string',
          displayOptions: { show: { resource: ['state'] } },
          default: '',
          required: true,
        },
        {
          displayName: 'State JSON',
          name: 'stateJson',
          type: 'json',
          displayOptions: { show: { resource: ['state'], operation: ['save'] } },
          default: '={}',
          description: 'The state data to save (use expressions like {{ $json }})',
        },
        // Queue operations
        {
          displayName: 'Operation',
          name: 'queueOperation',
          type: 'options',
          displayOptions: { show: { resource: ['queue'] } },
          options: [
            { name: 'Publish', value: 'publish' },
          ],
          default: 'publish',
        },
        {
          displayName: 'Routing Key',
          name: 'routingKey',
          type: 'string',
          displayOptions: { show: { resource: ['queue'] } },
          default: '',
        },
        {
          displayName: 'Message JSON',
          name: 'messageJson',
          type: 'json',
          displayOptions: { show: { resource: ['queue'] } },
          default: '={}',
          description: 'The message data to publish (use expressions like {{ $json }})',
        },
        // Optional URL overrides
        {
          displayName: 'Redis URL',
          name: 'redisUrl',
          type: 'string',
          default: '',
          description: 'Leave empty to use environment REDIS_URL',
        },
        {
          displayName: 'AMQP URL',
          name: 'amqpUrl',
          type: 'string',
          default: '',
          description: 'Leave empty to use environment MESSAGE_QUEUE_URL',
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const returnData = [];

    const logger = new Logger('info');
    const cache = new CacheManager(60000, 100);

    // Resolve URLs from params or env
    const redisUrl = (this.getNodeParameter('redisUrl', 0, '') || process.env.REDIS_URL || '').toString().trim();
    const amqpUrl = (this.getNodeParameter('amqpUrl', 0, '') || process.env.MESSAGE_QUEUE_URL || '').toString().trim();

    logger.info('Connection configuration', { 
      redisUrl: redisUrl ? `${redisUrl.split('://')[0]}://${redisUrl.split('://')[1]?.split('@')[1] || 'unknown'}` : 'not set',
      amqpUrl: amqpUrl ? `${amqpUrl.split('://')[0]}://${amqpUrl.split('://')[1]?.split('@')[1] || 'unknown'}` : 'not set'
    });

    if (!redisUrl || !amqpUrl) {
      throw new Error('Missing REDIS_URL or MESSAGE_QUEUE_URL');
    }

    const config = { redis_url: redisUrl, message_queue_url: amqpUrl };
    const pool = new ConnectionPoolManager(config);
    const stateManager = new EnhancedRedisStateManager(config, pool, logger, cache);
    const mq = new EnhancedMessageQueue(config, pool, logger);

    // Pre-initialize connections and wait for them to be ready
    try {
      const redisClient = await stateManager.init();
      // Wait for connection to be ready
      await new Promise((resolve, reject) => {
        if (redisClient.status === 'ready') {
          resolve();
        } else {
          redisClient.once('ready', resolve);
          redisClient.once('error', reject);
          setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
        }
      });
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to initialize state manager', { error: error.message });
      throw new Error(`Redis connection failed: ${error.message}. Check that Redis is running and accessible at ${redisUrl}`);
    }

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i);

      if (resource === 'state') {
        const op = this.getNodeParameter('operation', i);
        const executionId = String(this.getNodeParameter('executionId', i));

        if (op === 'load') {
          const state = await stateManager.loadState(executionId);
          returnData.push({ json: state });
        } else if (op === 'save') {
          const stateData = this.getNodeParameter('stateJson', i) || {};
          await stateManager.saveState({ executionId, ...stateData });
          returnData.push({ json: { ok: true, executionId } });
        }
      } else if (resource === 'queue') {
        const qop = this.getNodeParameter('queueOperation', i);
        if (qop === 'publish') {
        const routingKey = String(this.getNodeParameter('routingKey', i));
        const message = this.getNodeParameter('messageJson', i) || {};
          await mq.publish(routingKey, message);
          returnData.push({ json: { ok: true, routingKey } });
        }
      }
    }

    return [returnData];
  }
}

// Export in multiple ways for n8n loader compatibility
module.exports = EnhancedMaker;
module.exports.EnhancedMaker = EnhancedMaker;
