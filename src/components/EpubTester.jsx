// src/components/EpubTester.jsx
import React, { useState } from 'react';
import { analyzeEpubFile } from '../utils/epubUtils';
import DrivePickerButton from './DrivePickerButton';

const EpubTester = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('idle'); // idle, loading, success, error

  // Fonction de test d'importation directe par fichier
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setStep('loading');
    
    try {
      console.log(`Test d'importation du fichier local: ${file.name} (${file.size} octets)`);
      const result = await analyzeEpubFile(file, file.name);
      setTestResult(result);
      setStep('success');
      console.log("Test réussi:", result);
    } catch (err) {
      console.error("Erreur de test:", err);
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de test d'importation Drive
  const handleDriveImport = (result) => {
    setTestResult(result);
    setStep('success');
    console.log("Test Drive réussi:", result);
  };

  // Affichage des résultats du test
  const renderTestResult = () => {
    if (!testResult) return null;
    
    return (
      <div className="test-result">
        <h3>EPUB analysé avec succès</h3>
        <ul>
          <li><strong>Titre:</strong> {testResult.title}</li>
          <li><strong>Auteur:</strong> {testResult.author}</li>
          <li><strong>Chapitres:</strong> {testResult.chapters.length}</li>
          <li><strong>ID:</strong> {testResult.id}</li>
        </ul>
        
        {testResult.cover && (
          <div>
            <h4>Couverture:</h4>
            <img 
              src={testResult.cover} 
              alt="Couverture" 
              style={{ maxWidth: '200px', border: '1px solid #ccc' }} 
            />
          </div>
        )}
        
        <h4>Premier chapitre:</h4>
        <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '8px' }}>
          {testResult.chapters[0]?.content.slice(0, 500)}
          {testResult.chapters[0]?.content.length > 500 ? '...' : ''}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ddd' }}>
      <h2>Testeur d'importation EPUB</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>1. Test d'importation locale</h3>
        <input 
          type="file" 
          accept=".epub" 
          onChange={handleFileImport} 
          disabled={loading}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>2. Test d'importation Drive</h3>
        <DrivePickerButton onImport={handleDriveImport} />
      </div>
      
      {loading && (
        <div style={{ padding: '10px', background: '#f8f9fa', marginTop: '20px' }}>
          Analyse en cours...
        </div>
      )}
      
      {error && (
        <div style={{ padding: '10px', background: '#f8d7da', marginTop: '20px' }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}
      
      {step === 'success' && renderTestResult()}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <strong>Étapes de débogage:</strong>
        <ol>
          <li>Essayez d'abord l'importation locale pour vérifier la fonction d'analyse EPUB</li>
          <li>Si l'importation locale fonctionne mais pas Drive, le problème est dans l'API Google</li>
          <li>Vérifiez les logs de la console pour plus de détails</li>
        </ol>
      </div>
    </div>
  );
};

export default EpubTester;