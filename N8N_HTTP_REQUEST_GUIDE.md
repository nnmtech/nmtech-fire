# n8n HTTP Request Node Configuration for Remotion Renderer

## Complete HTTP Request Node Settings

When adding an HTTP Request node in n8n to call the Remotion renderer, configure it with these exact settings:

### Basic Settings

**Node Name**: `Render Video with Remotion` (or any name you prefer)

**URL**: `http://remotion-renderer:3001/render`

**Authentication**: `None` (or configure if you add auth later)

**Request Method**: `POST`

### Send Body Settings

**Send Body**: ✅ Enabled (toggle ON)

**Body Content Type**: `JSON`

**Specify Body**: `Using JSON`

**JSON Body** (in the expression editor):
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "{{ $json.videoText }}",
    "backgroundColor": "{{ $json.backgroundColor }}",
    "textColor": "{{ $json.textColor }}"
  }
}
```

### Alternative: Using Expression Mode

If using expressions instead of JSON editor:

**JSON Body Expression**:
```
={
  "executionId": $execution.id,
  "composition": "TextScene",
  "inputProps": {
    "text": $json.videoText,
    "backgroundColor": $json.backgroundColor,
    "textColor": $json.textColor
  }
}
```

## Step-by-Step Visual Guide

### Step 1: Add HTTP Request Node
1. Click the `+` button in your workflow
2. Search for "HTTP Request"
3. Select "HTTP Request" node

### Step 2: Configure URL
```
Field: URL
Value: http://remotion-renderer:3001/render
```

### Step 3: Set Method
```
Field: Method
Value: POST
```

### Step 4: Configure Body
1. Toggle **"Send Body"** to ON
2. Set **"Body Content Type"** to `JSON`
3. Set **"Specify Body"** to `Using JSON`

### Step 5: Add JSON Body
Click on the JSON Body field and paste:
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "Hello from n8n!",
    "backgroundColor": "#1a1a1a",
    "textColor": "#00ff88"
  }
}
```

## Example Workflows

### Simple Text Video

```
[Manual Trigger] 
    ↓
[HTTP Request: Render Video]
```

**HTTP Request Settings**:
- URL: `http://remotion-renderer:3001/render`
- Method: `POST`
- Body:
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "My Video Title",
    "backgroundColor": "#000000",
    "textColor": "#ffffff"
  }
}
```

### Dynamic Video from Webhook

```
[Webhook Trigger] 
    ↓
[Set Variables]
    ↓
[HTTP Request: Render Video]
```

**Set Variables Node**:
- `videoText`: `{{ $json.body.message }}`
- `bgColor`: `{{ $json.body.bgColor || '#1a1a1a' }}`
- `textColor`: `{{ $json.body.textColor || '#00ff88' }}`

**HTTP Request Node**:
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "{{ $json.videoText }}",
    "backgroundColor": "{{ $json.bgColor }}",
    "textColor": "{{ $json.textColor }}"
  }
}
```

### With Enhanced MAKER Integration

```
[Trigger]
    ↓
[Enhanced Maker: Save State]
    ↓
[HTTP Request: Render Video]
    ↓
[Enhanced Maker: Publish Message]
```

**Enhanced Maker Node 1** (Save State):
- Resource: `state`
- Operation: `saveState`
- Execution ID: `={{ $execution.id }}`
- State JSON:
```json
{
  "status": "rendering_requested",
  "composition": "TextScene",
  "requestedAt": "{{ $now }}"
}
```

**HTTP Request Node**:
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "{{ $json.text }}",
    "backgroundColor": "#1a1a1a",
    "textColor": "#00ff88"
  }
}
```

**Enhanced Maker Node 2** (Publish Message):
- Resource: `queue`
- Operation: `publish`
- Routing Key: `maker.render.complete`
- Message JSON: `={{ $json }}`

## All Composition Types

### TextScene
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "TextScene",
  "inputProps": {
    "text": "Your text here",
    "backgroundColor": "#1a1a1a",
    "textColor": "#00ff88"
  }
}
```

### ImageScene
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "ImageScene",
  "inputProps": {
    "imageUrl": "https://picsum.photos/1920/1080",
    "overlayText": "My Caption",
    "overlayPosition": "bottom"
  }
}
```

### MultiSceneVideo
```json
{
  "executionId": "{{ $execution.id }}",
  "composition": "MultiSceneVideo",
  "inputProps": {
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
      },
      {
        "type": "text",
        "duration": 120,
        "props": {
          "text": "Scene 3 - The End",
          "backgroundColor": "#000000",
          "textColor": "#ffffff"
        }
      }
    ]
  }
}
```

## Common Issues & Solutions

### Issue: "Cannot read property 'videoText' of undefined"
**Solution**: Make sure you have a Set node or previous node that provides the `videoText` field. Or use a hardcoded value:
```json
{
  "text": "Fixed Text Value"
}
```

### Issue: Expression not evaluated
**Solution**: Use the expression syntax correctly:
- n8n v1: `{{ $json.field }}`
- Expression editor: Just reference `$json.field` directly

### Issue: "Connection refused"
**Solution**: Make sure you're using the Docker service name:
- ✅ Correct: `http://remotion-renderer:3001/render`
- ❌ Wrong: `http://localhost:3001/render`

### Issue: Timeout after 5 minutes
**Solution**: Video rendering takes time (60-180 seconds). In the HTTP Request node options, increase the timeout:
- Options → Timeout: `180000` (3 minutes in milliseconds)

## Testing Your Configuration

1. **Test Health Endpoint First**:
   - URL: `http://remotion-renderer:3001/health`
   - Method: `GET`
   - Expected response: `{"status":"ok","service":"remotion-renderer"}`

2. **Test Simple Render**:
   - Use the TextScene example above
   - Execute the workflow
   - Check logs: `docker logs remotion-renderer -f`

3. **Verify Output**:
   ```bash
   docker exec remotion-renderer ls -lh /app/output/
   ```

## Import Example Workflow

You can import the example workflow from `example-workflow.json` in this directory:

1. Open n8n at http://localhost:5679
2. Click "..." menu → Import from File
3. Select `/media/nmtech/VT/NGROK/example-workflow.json`
4. Execute to test

The workflow includes:
- Manual trigger
- Set variables for video parameters
- HTTP Request to Remotion renderer

## Response Format

**Success Response**:
```json
{
  "success": true,
  "executionId": "your-execution-id",
  "outputPath": "/app/output/your-execution-id.mp4",
  "duration": 90.13
}
```

**Error Response**:
```json
{
  "error": "Error message description"
}
```

## Next Steps

1. Import the example workflow
2. Test with the manual trigger
3. Modify the text/colors to see changes
4. Try different compositions (ImageScene, MultiSceneVideo)
5. Integrate with your existing workflows
