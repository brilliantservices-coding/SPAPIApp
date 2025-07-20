import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AmazonOAuth from './components/AmazonOAuth';
import OrdersList from './components/OrdersList';
import OAuthCallback from './components/OAuthCallback';

function App() {
  const [activeTab, setActiveTab] = useState('oauth');

  const MainApp = () => (
    <>
      <header className="App-header">
        <div className="header-content">
          <h1>Amazon SP API Helper</h1>
          <p>Manage your Amazon Seller account and orders</p>
        </div>
      </header>

      <nav className="App-nav">
        <div className="nav-content">
          <button 
            className={`nav-tab ${activeTab === 'oauth' ? 'active' : ''}`}
            onClick={() => setActiveTab('oauth')}
          >
            🔐 Authorization
          </button>
          <button 
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Orders
          </button>
        </div>
      </nav>

      <main className="App-main">
        {activeTab === 'oauth' ? (
          <AmazonOAuth />
        ) : (
          <OrdersList />
        )}
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <p>&copy; 2024 Amazon SP API Helper. Built with React and Node.js</p>
        </div>
      </footer>
    </>
  );

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/" element={<MainApp />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
