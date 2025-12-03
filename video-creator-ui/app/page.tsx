export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="mb-8">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Create Stunning Videos
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Transform your ideas into beautiful videos with AI-powered rendering.
          Choose from multiple composition types and customize every aspect.
        </p>
      </div>

      <div className="flex gap-4 mb-12">
        <a
          href="/create"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
        >
          Start Creating →
        </a>
        <a
          href="/library"
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-lg transition-colors"
        >
          View Library
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-xl font-semibold mb-2">Text Scenes</h3>
          <p className="text-gray-400">
            Create animated text videos with custom colors, fonts, and effects
          </p>
        </div>

        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-4xl mb-3">🖼️</div>
          <h3 className="text-xl font-semibold mb-2">Image Scenes</h3>
          <p className="text-gray-400">
            Add images with zoom effects and beautiful overlays
          </p>
        </div>

        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-4xl mb-3">🎞️</div>
          <h3 className="text-xl font-semibold mb-2">Multi-Scene</h3>
          <p className="text-gray-400">
            Combine multiple scenes into a seamless video with transitions
          </p>
        </div>
      </div>

      <div className="mt-16 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30 max-w-2xl">
        <p className="text-sm text-gray-300">
          <strong className="text-blue-400">Free Tier:</strong> Create up to 10 videos per month
          <span className="mx-2">•</span>
          <strong className="text-purple-400">Paid Tier:</strong> Unlimited videos + advanced features
        </p>
      </div>
    </div>
  );
}
