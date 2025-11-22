import ScrollVideo from "./components/ScrollVideo";

function App() {
  const sampleFrames = null; // Provide an array of image URLs to use real frames

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="relative z-10">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Scroll-Scrub Video</h1>
          <p className="mt-3 text-blue-200/80 max-w-2xl">
            Scroll down to scrub through frames. If you have an image sequence, pass the URLs to the component to use real frames. By default, it renders a procedural animation.
          </p>
        </div>
      </header>

      <ScrollVideo heightVh={300} totalFrames={180} imageUrls={sampleFrames} className="bg-slate-900" />

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 space-y-6">
        <h2 className="text-2xl font-semibold">How to supply your own frames</h2>
        <ol className="list-decimal list-inside text-blue-200/80 space-y-2">
          <li>Export a video as an image sequence (PNG/JPG) named like 0001.jpg, 0002.jpg, ...</li>
          <li>Host the images in the public folder or on a CDN and provide their URLs as an array to the component.</li>
          <li>Ensure all frames have the same dimensions for smooth rendering.</li>
        </ol>

        <div className="mt-6 rounded-xl border border-blue-500/20 bg-slate-800/50 p-4">
          <pre className="text-sm text-blue-200/90 whitespace-pre-wrap">{`
// Example usage with local frames in /public/frames
const frames = Array.from({ length: 120 }, (_, i) => {
  const id = String(i + 1).padStart(4, '0');
  return "/frames/" + id + ".jpg";
});

<ScrollVideo imageUrls={frames} totalFrames={frames.length} />
          `}</pre>
        </div>

        <a href="/test" className="inline-flex items-center text-blue-300 hover:text-blue-200 underline">
          API and database test page
        </a>
      </section>

      <footer className="py-10 text-center text-blue-300/60">Built with Flames Blue</footer>
    </div>
  );
}

export default App;
