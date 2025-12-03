'use client'

import { useState, useEffect } from 'react'

export default function LibraryPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)

  useEffect(() => {
    // TODO: Replace with actual Supabase query after auth is implemented
    // For now, this is a placeholder that will show empty state
    setLoading(false)
    setVideos([])
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading your videos...</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Video Library
        </h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-2xl font-semibold mb-3">No Videos Yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first video to see it here in your library
          </p>
          <a
            href="/create"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Create Your First Video →
          </a>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30">
          <h3 className="font-semibold mb-2">Coming Soon:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• View all your created videos with thumbnails</li>
            <li>• Download and share videos easily</li>
            <li>• Track your monthly usage (Free: 10 videos/month)</li>
            <li>• Filter by composition type and date</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Video Library
        </h1>
        <div className="text-sm bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
          <span className="text-gray-400">Videos this month:</span>
          <span className="ml-2 font-semibold">{videos.length}/10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="aspect-video bg-gray-800 relative">
              <img
                src={video.thumbnail_url}
                alt={video.title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                {video.duration_seconds}s
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold mb-1 truncate">
                {video.title || video.execution_id}
              </h3>
              <p className="text-sm text-gray-400 mb-2">{video.composition_type}</p>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                <span>{(video.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href={video.public_url}
                  download
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center text-sm transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(video.public_url)
                    alert('URL copied!')
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedVideo.title || selectedVideo.execution_id}
                </h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <video
                controls
                autoPlay
                className="w-full rounded-lg mb-4"
                src={selectedVideo.public_url}
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2">{selectedVideo.composition_type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2">{selectedVideo.duration_seconds}s</span>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>
                  <span className="ml-2">
                    {(selectedVideo.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="ml-2">
                    {new Date(selectedVideo.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
