import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BookLibrary from './BookLibrary';
import BookReader from './BookReader';
import DriveEpubReader from './components/DriveEpubReader';

import './styles.css';
import './reader-styles.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<BookLibrary />} />
      <Route path="/read/:bookId" element={<BookReader />} />
      <Route path="/drive" element={<DriveEpubReader />} />
      <Route path="/test" element={<div>Test route ok</div>} />
    </Routes>
  );
}

export default App;
