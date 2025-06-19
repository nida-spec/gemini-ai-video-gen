import VideoGenerator from "./pages/VideoGenerator";

function App() {
  return (
    <div className='min-h-screen bg-gray-50 text-gray-900'>
      <header className='bg-gray-600 text-white py-4 shadow'>
        <h1 className='text-2xl font-bold text-center'>
          Gemini AI Video Generator
        </h1>
      </header>

      <main className='p-4'>
        <VideoGenerator />
      </main>

      <footer className='text-center py-4 text-xs text-gray-500'>
        &copy; {new Date().getFullYear()} Gemini AI Video Generator
      </footer>
    </div>
  );
}

export default App;
