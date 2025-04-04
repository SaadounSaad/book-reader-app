// ReadingStats.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './ReadingStats.css';

const ReadingStats = ({ readingData, bookData }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [stats, setStats] = useState({
    totalPagesRead: 0,
    totalReadingTime: 0,
    averageReadingSpeed: 0,
    completionPercentage: 0,
    sessionsCount: 0,
    lastReadingSession: null,
    longestSession: 0
  });
  
  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  useEffect(() => {
    if (readingData && bookData) {
      // Calculer les statistiques à partir des données de lecture
      const totalPages = readingData.reduce((sum, session) => sum + session.pagesRead, 0);
      const totalTime = readingData.reduce((sum, session) => sum + session.duration, 0);
      const avgSpeed = totalTime > 0 ? (totalPages / (totalTime / 60)).toFixed(2) : 0;
      const completion = bookData.totalPages > 0 ? ((bookData.currentPage / bookData.totalPages) * 100).toFixed(1) : 0;
      const longestSession = Math.max(...readingData.map(session => session.duration));
      
      setStats({
        totalPagesRead: totalPages,
        totalReadingTime: totalTime, // en minutes
        averageReadingSpeed: avgSpeed, // pages par heure
        completionPercentage: completion,
        sessionsCount: readingData.length,
        lastReadingSession: readingData.length > 0 ? readingData[readingData.length - 1].date : null,
        longestSession: longestSession
      });
    }
  }, [readingData, bookData]);
  
  // Préparer les données pour le graphique quotidien
  const prepareDailyData = () => {
    if (!readingData) return [];
    
    // Regrouper les sessions par jour
    const groupedByDay = readingData.reduce((acc, session) => {
      const date = new Date(session.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          pagesRead: 0,
          timeSpent: 0
        };
      }
      acc[date].pagesRead += session.pagesRead;
      acc[date].timeSpent += session.duration;
      return acc;
    }, {});
    
    // Convertir en tableau pour le graphique
    return Object.values(groupedByDay).slice(-7); // Derniers 7 jours
  };
  
  // Préparer les données pour le graphique hebdomadaire
  const prepareWeeklyData = () => {
    if (!readingData) return [];
    
    // Regrouper les sessions par semaine
    const groupedByWeek = readingData.reduce((acc, session) => {
      const date = new Date(session.date);
      const weekNumber = getWeekNumber(date);
      const weekLabel = `S${weekNumber}`;
      
      if (!acc[weekLabel]) {
        acc[weekLabel] = {
          week: weekLabel,
          pagesRead: 0,
          timeSpent: 0
        };
      }
      acc[weekLabel].pagesRead += session.pagesRead;
      acc[weekLabel].timeSpent += session.duration;
      return acc;
    }, {});
    
    // Convertir en tableau pour le graphique
    return Object.values(groupedByWeek).slice(-6); // Dernières 6 semaines
  };
  
  // Préparer les données pour le graphique mensuel
  const prepareMonthlyData = () => {
    if (!readingData) return [];
    
    // Regrouper les sessions par mois
    const groupedByMonth = readingData.reduce((acc, session) => {
      const date = new Date(session.date);
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      if (!acc[monthLabel]) {
        acc[monthLabel] = {
          month: monthLabel,
          pagesRead: 0,
          timeSpent: 0
        };
      }
      acc[monthLabel].pagesRead += session.pagesRead;
      acc[monthLabel].timeSpent += session.duration;
      return acc;
    }, {});
    
    // Convertir en tableau pour le graphique
    return Object.values(groupedByMonth).slice(-6); // Derniers 6 mois
  };
  
  // Préparer les données pour le graphique de distribution par chapitres
  const prepareChapterDistribution = () => {
    if (!readingData || !bookData.chapters) return [];
    
    // Initialiser les compteurs pour chaque chapitre
    const chapterData = bookData.chapters.map(chapter => ({
      name: chapter.title.length > 15 ? chapter.title.substring(0, 15) + '...' : chapter.title,
      timeSpent: 0,
      value: 0 // Pour le PieChart
    }));
    
    // Ajouter les temps de lecture par chapitre
    readingData.forEach(session => {
      if (session.chapterId >= 0 && session.chapterId < chapterData.length) {
        chapterData[session.chapterId].timeSpent += session.duration;
        chapterData[session.chapterId].value += session.duration;
      }
    });
    
    return chapterData;
  };
  
  // Fonction pour obtenir le numéro de la semaine
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Formater le temps en heures et minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };
  
  const renderDailyTab = () => {
    const dailyData = prepareDailyData();
    
    return (
      <div className="stats-tab-content">
        <h3>Activité quotidienne</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip formatter={(value, name) => {
              if (name === 'pagesRead') return [`${value} pages`, 'Pages lues'];
              if (name === 'timeSpent') return [formatTime(value), 'Temps de lecture'];
              return [value, name];
            }} />
            <Legend />
            <Bar yAxisId="left" dataKey="pagesRead" name="Pages lues" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="timeSpent" name="Temps (min)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderWeeklyTab = () => {
    const weeklyData = prepareWeeklyData();
    
    return (
      <div className="stats-tab-content">
        <h3>Activité hebdomadaire</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip formatter={(value, name) => {
              if (name === 'pagesRead') return [`${value} pages`, 'Pages lues'];
              if (name === 'timeSpent') return [formatTime(value), 'Temps de lecture'];
              return [value, name];
            }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="pagesRead" name="Pages lues" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="timeSpent" name="Temps (min)" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderMonthlyTab = () => {
    const monthlyData = prepareMonthlyData();
    
    return (
      <div className="stats-tab-content">
        <h3>Activité mensuelle</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip formatter={(value, name) => {
              if (name === 'pagesRead') return [`${value} pages`, 'Pages lues'];
              if (name === 'timeSpent') return [formatTime(value), 'Temps de lecture'];
              return [value, name];
            }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="pagesRead" name="Pages lues" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="timeSpent" name="Temps (min)" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderChaptersTab = () => {
    const chapterData = prepareChapterDistribution();
    
    return (
      <div className="stats-tab-content">
        <h3>Temps passé par chapitre</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chapterData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {chapterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [formatTime(value), props.payload.name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <div className="reading-stats-container">
      <div className="stats-summary">
        <div className="stats-card">
          <h4>Progression</h4>
          <p className="stats-value">{stats.completionPercentage}%</p>
        </div>
        <div className="stats-card">
          <h4>Pages lues</h4>
          <p className="stats-value">{stats.totalPagesRead}</p>
        </div>
        <div className="stats-card">
          <h4>Temps total</h4>
          <p className="stats-value">{formatTime(stats.totalReadingTime)}</p>
        </div>
        <div className="stats-card">
          <h4>Vitesse moyenne</h4>
          <p className="stats-value">{stats.averageReadingSpeed} p/h</p>
        </div>
      </div>
      
      <div className="stats-tabs">
        <div className="stats-tab-buttons">
          <button 
            className={activeTab === 'daily' ? 'active' : ''} 
            onClick={() => setActiveTab('daily')}
          >
            Quotidien
          </button>
          <button 
            className={activeTab === 'weekly' ? 'active' : ''} 
            onClick={() => setActiveTab('weekly')}
          >
            Hebdomadaire
          </button>
          <button 
            className={activeTab === 'monthly' ? 'active' : ''} 
            onClick={() => setActiveTab('monthly')}
          >
            Mensuel
          </button>
          <button 
            className={activeTab === 'chapters' ? 'active' : ''} 
            onClick={() => setActiveTab('chapters')}
          >
            Chapitres
          </button>
        </div>
        
        <div className="stats-tab-content">
          {activeTab === 'daily' && renderDailyTab()}
          {activeTab === 'weekly' && renderWeeklyTab()}
          {activeTab === 'monthly' && renderMonthlyTab()}
          {activeTab === 'chapters' && renderChaptersTab()}
        </div>
      </div>
    </div>
  );
};

export default ReadingStats;