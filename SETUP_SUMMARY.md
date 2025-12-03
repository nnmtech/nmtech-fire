# Enhanced MAKER Video Generator - Setup Summary

## 📁 File Locations

### Custom Node
- **Source**: `/media/nmtech/VT/NGROK/custom-nodes/n8n-nodes-enhanced-maker/`
- **Deployed**: `~/.n8n/custom/nodes/EnhancedMaker.node.js` (in n8n-instance-2 container)
- **Backup**: `EnhancedMaker.node.js.backup`
- **Working Version**: `EnhancedMaker.node.working.js`

### Enhanced Maker Library
- **Location**: `/opt/enhanced-maker/enhanced-maker.js` (bind-mounted read-only)
- **Features**: 961 lines, 13 classes (ConnectionPoolManager, CacheManager, CircuitBreaker, EnhancedRedisStateManager, EnhancedMessageQueue, etc.)

### Configuration
- **Docker Compose**: `docker-compose.yaml` (backup: `docker-compose.yaml.backup`)
- **Workflows**: `/home/nmtech/.n8n/` (10+ existing workflows preserved)

## 🎯 Working Configuration

### n8n Custom Node Parameters
```javascript
// For state operations
Resource: "state"
Operation: "save" or "load"
Execution ID: {{ $execution.id }}
State JSON: {{ $json }}  // Type: json (not string!)

// For queue operations
Resource: "queue"
Queue Operation: "publish"
Routing Key: "maker.phase.complete"
Message JSON: {{ $json }}  // Type: json (not string!)
```

### Environment Variables (in n8n-instance-2)
```bash
REDIS_URL=redis://redis:6379
MESSAGE_QUEUE_URL=amqp://guest:guest@rabbitmq:5672
```

## 🐳 Docker Services

### Running Services
- **n8n-instance-2**: Port 5679, uses /home/nmtech/.n8n bind mount
- **redis**: Port 6379, AOF persistence enabled
- **rabbitmq**: Ports 5672 (AMQP), 15672 (management)
- **message-subscriber**: Consumes from 4 queues

### RabbitMQ Configuration
- **Queues**: Created with `messageTtl: 300000` (5 minutes), `deadLetterExchange: 'maker.dlx'`
- **Exchanges**: maker.events, maker.dlx, maker.retry
- **Important**: Subscriber must be stopped before workflow creates queues for first time

## ✅ Verified Working

1. **State Management**: 
   - Save state to Redis with versioning
   - Load state by execution ID
   - Keys: `maker:state:{executionId}`, `maker:state:{executionId}:v{version}`

2. **Message Queue**:
   - Publish messages to RabbitMQ
   - Subscriber consumes and processes messages
   - Automatically loads state when message contains executionId

3. **Full Stack**:
   - n8n → EnhancedMaker node → Redis/RabbitMQ
   - RabbitMQ → message-subscriber → Redis state lookup
   - All 14 test executions stored successfully

## 🔧 Key Fixes Applied

1. **Changed parameter types from `string` to `json`** - Allows n8n expressions to pass objects directly
2. **Removed TypeScript syntax** - Changed `implements INodeType` to plain class
3. **Added connection waiting** - Waits for Redis connection ready state before operations
4. **Fixed queue TTL conflict** - Ensured queues created with consistent settings
5. **Added String() coercion** - For executionId and routingKey parameters

## 📝 Usage Notes

- Leave "Redis URL" and "AMQP URL" fields **empty** in the node (uses env vars automatically)
- Use `{{ $execution.id }}` for Execution ID
- Use `{{ $json }}` for State JSON and Message JSON (no `=` prefix needed)
- If queue conflicts occur, stop message-subscriber, delete queues, run workflow, then start subscriber

## 🚀 Next Steps

The infrastructure is ready for:
- Video generation workflows
- State tracking across phases
- Microtask distribution
- Voting/approval flows
- Manual review queues
- Rollback mechanisms
