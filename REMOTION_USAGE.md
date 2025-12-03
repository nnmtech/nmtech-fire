# Using Remotion Renderer with n8n

## Overview
The Remotion renderer is now running as a service alongside n8n, Redis, and RabbitMQ. It provides a REST API for generating videos programmatically.

## Service Details
- **Container**: remotion-renderer
- **Port**: 3001
- **Endpoint**: POST http://remotion-renderer:3001/render
- **Health Check**: GET http://remotion-renderer:3001/health

## Available Compositions

### 1. TextScene
Simple text animation with fade-in and scale effects.

**Duration**: 5 seconds (150 frames @ 30fps)

**Input Props**:
```json
{
  "text": "Your text here",
  "backgroundColor": "#000000",
  "textColor": "#ffffff"
}
```

### 2. ImageScene
Image display with zoom effect and optional overlay text.

**Duration**: 6 seconds (180 frames @ 30fps)

**Input Props**:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "overlayText": "Optional caption",
  "overlayPosition": "bottom"
}
```

### 3. MultiSceneVideo
Sequence multiple scenes with transitions.

**Duration**: 10 seconds (300 frames @ 30fps)

**Input Props**:
```json
{
  "scenes": [
    {
      "type": "text",
      "duration": 90,
      "props": {
        "text": "Scene 1",
        "backgroundColor": "#1a1a1a",
        "textColor": "#00ff88"
      }
    },
    {
      "type": "image",
      "duration": 90,
      "props": {
        "imageUrl": "https://picsum.photos/1920/1080",
        "overlayText": "Scene 2"
      }
    }
  ]
}
```

## n8n Workflow Integration

### Method 1: HTTP Request Node (Simple)

1. Add an **HTTP Request** node
2. Configure:
   - **Method**: POST
   - **URL**: `http://remotion-renderer:3001/render`
   - **Authentication**: None
   - **Body Content Type**: JSON
   - **Body**:
   ```json
   {
     "executionId": "={{ $execution.id }}",
     "composition": "TextScene",
     "inputProps": {
       "text": "={{ $json.text || 'Default Text' }}",
       "backgroundColor": "#1a1a1a",
       "textColor": "#00ff88"
     }
   }
   ```

### Method 2: Enhanced MAKER Custom Node + HTTP Request

This method uses the full infrastructure for state tracking and message publishing.

**Workflow Structure**:
```
[Trigger] → [Enhanced Maker: Save State] → [HTTP Request: Render] → [Enhanced Maker: Publish Message]
```

**Node 1: Enhanced Maker - Save State**
```
Resource: state
Operation: saveState
Execution ID: ={{ $execution.id }}
State JSON: ={{
  {
    "status": "rendering_requested",
    "composition": "TextScene",
    "inputData": $json
  }
}}
```

**Node 2: HTTP Request - Trigger Render**
```
Method: POST
URL: http://remotion-renderer:3001/render
Body: {
  "executionId": "={{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "={{ $json.text }}",
    "backgroundColor": "#1a1a1a",
    "textColor": "#00ff88"
  }
}
```

**Node 3: Enhanced Maker - Publish Completion (optional)**
```
Resource: queue
Operation: publish
Routing Key: maker.render.complete
Message JSON: ={{ $json }}
```

## API Response

**Success Response**:
```json
{
  "success": true,
  "executionId": "test-render-001",
  "outputPath": "/app/output/test-render-001.mp4",
  "duration": 90.13
}
```

**Error Response**:
```json
{
  "error": "Error message here"
}
```

## Accessing Rendered Videos

Videos are stored in a Docker volume: `ngrok_remotion_output`

To copy a video out of the container:
```bash
docker cp remotion-renderer:/app/output/your-execution-id.mp4 ./local-file.mp4
```

To list all rendered videos:
```bash
docker exec remotion-renderer ls -lh /app/output/
```

## State Management

The renderer automatically:
1. Saves state to Redis before rendering: `maker:state:{executionId}`
2. Updates state during rendering with `renderStatus: 'rendering'`
3. Updates state after completion with `renderStatus: 'completed'` and output path
4. Publishes message to RabbitMQ on `maker.render.complete` routing key

Check state in Redis:
```bash
docker exec redis redis-cli GET maker:state:your-execution-id
```

## Example: Full n8n Workflow

**Use Case**: Generate a video from webhook data

```
Webhook → Set Variables → Enhanced Maker (Save State) → HTTP Request (Render) → Wait → Enhanced Maker (Load State) → Respond to Webhook
```

**Webhook Trigger**:
```json
{
  "text": "Welcome to Enhanced MAKER!",
  "backgroundColor": "#0a0a0a",
  "textColor": "#00ffaa"
}
```

**HTTP Request Body**:
```json
{
  "executionId": "={{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "={{ $json.text }}",
    "backgroundColor": "={{ $json.backgroundColor }}",
    "textColor": "={{ $json.textColor }}"
  }
}
```

## Performance Notes

- **TextScene**: ~90 seconds render time (150 frames)
- **ImageScene**: ~120 seconds render time (180 frames)
- **MultiSceneVideo**: ~180+ seconds render time (300+ frames)

Rendering is CPU-intensive. Consider:
- Adding more CPU resources to the container
- Implementing a queue system for batch rendering
- Using shorter durations for faster testing

## Troubleshooting

**Check service health**:
```bash
curl http://localhost:3001/health
```

**View logs**:
```bash
docker logs remotion-renderer --tail 50 -f
```

**Restart service**:
```bash
docker compose restart remotion-renderer
```

**Rebuild after code changes**:
```bash
docker compose build remotion-renderer
docker compose up -d remotion-renderer
```
