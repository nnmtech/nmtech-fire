'use client'

import { useState } from 'react'
import { config } from '@/lib/config'
import { ColorPicker } from '@/components/ColorPicker'
import { HelpPanel } from '@/components/HelpPanel'

type CompositionType = 'TextScene' | 'ImageScene' | 'MultiSceneVideo'

export default function CreatePage() {
  const [composition, setComposition] = useState<CompositionType>('TextScene')
  const [isRendering, setIsRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [creativeMode, setCreativeMode] = useState(true)

  // TextScene form state
  const [text, setText] = useState('A serene nature scene with mountains and forests')
  const [backgroundColor, setBackgroundColor] = useState('#0a0a0a')
  const [textColor, setTextColor] = useState('#ffffff')

  // ImageScene form state
  const [imageUrl, setImageUrl] = useState('')
  const [overlayText, setOverlayText] = useState('Amazing Image')

  // MultiSceneVideo form state
  const [scenes, setScenes] = useState([
    { type: 'text', content: 'A peaceful morning in the mountains. The sun rises over the peaks.' },
    { type: 'text', content: 'Birds singing in the forest. Nature awakens with beauty.' },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRendering(true)
    setError(null)
    setResult(null)
    setProgress(0)

    const executionId = `video-${Date.now()}`
    
    let inputProps: any = {}

    switch (composition) {
      case 'TextScene':
        inputProps = { text, backgroundColor, textColor }
        break
      case 'ImageScene':
        inputProps = { imageUrl, overlayText }
        break
      case 'MultiSceneVideo':
        // Transform scenes to match Remotion component format
        inputProps = {
          scenes: scenes.map(scene => ({
            type: scene.type,
            duration: 90, // 3 seconds at 30fps
            props: scene.type === 'text' 
              ? { text: scene.content, backgroundColor: '#0a0a0a', textColor: '#ffffff' }
              : { imageUrl: scene.content, overlayText: 'Scene' }
          }))
        }
        break
    }

    try {
      console.log('Making API request to:', `${config.remotionApiUrl}/render`)
      
      const response = await fetch(`${config.remotionApiUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          composition,
          userId: null, // Will be set to actual user ID after auth is implemented
          inputProps,
          generateCreative: creativeMode,
        }),
      })

      if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
      setProgress(100)
    } catch (err: any) {
      setError(err.message || 'Failed to render video')
    } finally {
      setIsRendering(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Create Your Video
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Composition Selector */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <label className="block text-sm font-medium mb-3">Composition Type</label>
            <div className="space-y-2">
              {(['TextScene', 'ImageScene', 'MultiSceneVideo'] as CompositionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setComposition(type)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    composition === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {type === 'TextScene' && '📝 Text Scene (5s)'}
                  {type === 'ImageScene' && '🖼️ Image Scene (6s)'}
                  {type === 'MultiSceneVideo' && '🎞️ Multi-Scene (10s)'}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
            {/* Creative Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-1">
                  🎨 AI Creative Mode
                </label>
                <p className="text-xs text-gray-400">
                  {creativeMode 
                    ? 'AI will interpret your description and create artistic scenes' 
                    : 'Use exact text/images you specify'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreativeMode(!creativeMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  creativeMode ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    creativeMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {composition === 'TextScene' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {creativeMode ? 'Video Description (AI will enhance)' : 'Text Content'}
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={creativeMode 
                      ? "Describe your video scene... e.g. 'A peaceful morning in nature with mountains'"
                      : "Enter exact text to display..."}
                  />
                  {creativeMode && (
                    <p className="text-xs text-purple-400 mt-1">
                      ✨ AI will analyze themes, choose colors, and create styled visuals
                    </p>
                  )}
                </div>

                {!creativeMode && (
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Background Color"
                      value={backgroundColor}
                      onChange={setBackgroundColor}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={textColor}
                      onChange={setTextColor}
                    />
                  </div>
                )}
              </>
            )}

            {composition === 'ImageScene' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Overlay Text</label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Text to display over image..."
                  />
                </div>
              </>
            )}

            {composition === 'MultiSceneVideo' && (
              <div>
                <label className="block text-sm font-medium mb-2">Scenes</label>
                <p className="text-sm text-gray-400 mb-3">
                  Multi-scene videos combine multiple text scenes with transitions
                </p>
                {scenes.map((scene, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="text"
                      value={scene.content}
                      onChange={(e) => {
                        const newScenes = [...scenes]
                        newScenes[index].content = e.target.value
                        setScenes(newScenes)
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Scene ${index + 1} content...`}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isRendering}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {isRendering ? 'Rendering...' : 'Create Video'}
            </button>
          </form>
        </div>

        {/* Preview / Result Area */}
        <div className="space-y-6">
          {isRendering && (
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Rendering...</h3>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                This may take 1-6 minutes depending on complexity
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-green-400">✅ Video Created!</h3>
              
              <video
                controls
                className="w-full rounded-lg mb-4"
                src={result.publicUrl}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">File Size:</span>
                  <span>{(result.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Render Time:</span>
                  <span>{(result.duration / 1000).toFixed(1)}s</span>
                </div>

                <div className="flex gap-2">
                  <a
                    href={result.publicUrl}
                    download
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.publicUrl)
                      alert('URL copied to clipboard!')
                    }}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isRendering && !result && !error && (
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-gray-400">
                Configure your video settings and click "Create Video" to start rendering
              </p>
            </div>
          )}
        </div>
      </div>
      
      <HelpPanel />
    </div>
  )
}
