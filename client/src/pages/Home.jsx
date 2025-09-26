import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to services page
    navigate('/services');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center shadow-xl h-screen p-6">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        
      </div>
    </div>
  );
}

export default Home;