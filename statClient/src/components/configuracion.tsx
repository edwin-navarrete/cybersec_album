import React from 'react';

const loadingImage = "https://media.tenor.com/to0k0Ly8tDQAAAAi/busy-cat.gif"

function Loading() {
  return (
    <>
        
    
        <h1>Estamos trabajando</h1>
      <img src={loadingImage} alt="Loading..." />
      </>
  );
}

export default Loading;
