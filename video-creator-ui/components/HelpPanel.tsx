'use client'

import { useState } from 'react'

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-2xl shadow-lg z-50"
      >
        ?
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-bold text-lg">📖 How to Use</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-blue-400 mb-2">📝 Text Scene</h4>
          <p className="text-gray-300">Create a simple animated text video. Perfect for quotes, announcements, or titles.</p>
          <ul className="mt-2 space-y-1 text-gray-400 text-xs">
            <li>• Duration: 5 seconds</li>
            <li>• Customize text, colors</li>
            <li>• Animated fade-in effect</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-purple-400 mb-2">🖼️ Image Scene</h4>
          <p className="text-gray-300">Display an image with optional text overlay. Great for photo slideshows.</p>
          <ul className="mt-2 space-y-1 text-gray-400 text-xs">
            <li>• Duration: 6 seconds</li>
            <li>• Provide image URL</li>
            <li>• Add custom overlay text</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-pink-400 mb-2">🎞️ Multi-Scene</h4>
          <p className="text-gray-300">Combine multiple scenes into one video with smooth transitions.</p>
          <ul className="mt-2 space-y-1 text-gray-400 text-xs">
            <li>• Duration: ~10 seconds</li>
            <li>• Mix text and image scenes</li>
            <li>• Automatic fade transitions</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <h4 className="font-semibold text-yellow-400 mb-2">⚡ Pro Tips</h4>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>• Use the color presets for quick styling</li>
            <li>• Keep text short for better readability</li>
            <li>• Videos are saved to your library</li>
            <li>• <span className="text-blue-400">Upgrade to Pro</span> for longer videos, no watermarks, and more templates!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
