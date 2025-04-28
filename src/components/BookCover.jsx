// src/components/BookCover.jsx
import React, { useState, useEffect } from 'react';

const BookCover = ({ coverPath }) => {
  const [coverSrc, setCoverSrc] = useState('/covers/default.jpg'); // 📂 Image par défaut si rien trouvé

  useEffect(() => {
    if (!coverPath) return;

    const loadCover = () => {
      // Si c'est un lien enregistré dans localStorage (ex : cover_12345)
      if (coverPath.startsWith('cover_')) {
        const localImage = localStorage.getItem(coverPath);
        if (localImage) {
          setCoverSrc(localImage);
        }
      } 
      // Si c'est une URL externe ou une image locale normale
      else {
        setCoverSrc(coverPath);
      }
    };

    loadCover();
  }, [coverPath]);

  return (
    <img
      src={coverSrc}
      alt="Couverture du livre"
      style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
    />
  );
};

export default BookCover;
