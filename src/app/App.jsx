import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Dashboard,
  initializeDashboard 
} from '@/modules/dashboard';
import { 
  Layout, 
  ZaptBadge,
  NotFound,
  initializeCore 
} from '@/modules/core';
import { 
  CompanyList, 
  CompanyDetail, 
  CompanyForm,
  initializeCompanies
} from '@/modules/companies';
import { 
  ResourceList, 
  ResourceForm, 
  ResourceDistribution,
  initializeResources
} from '@/modules/resources';
import { initializeActivities } from '@/modules/activities';
import { initializeEngagements } from '@/modules/engagements';
import { initializeFiles } from '@/modules/files';
import { initializeTags } from '@/modules/tags';

const App = () => {
  // Initialize all modules when app starts
  useEffect(() => {
    const initializeModules = async () => {
      try {
        console.log('Initializing application modules...');
        
        await Promise.all([
          initializeCore(),
          initializeDashboard(),
          initializeCompanies(),
          initializeResources(),
          initializeActivities(),
          initializeEngagements(),
          initializeFiles(),
          initializeTags()
        ]);
        
        console.log('All modules initialized successfully');
      } catch (error) {
        console.error('Error initializing modules:', error);
      }
    };
    
    initializeModules();
  }, []);
  
  return (
    <div className="min-h-screen">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/companies/new" element={<CompanyForm />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/companies/:id/edit" element={<CompanyForm />} />
          <Route path="/resources" element={<ResourceList />} />
          <Route path="/resources/new" element={<ResourceForm />} />
          <Route path="/resources/:id/edit" element={<ResourceForm />} />
          <Route path="/resources/:id/distribute" element={<ResourceDistribution />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <ZaptBadge />
    </div>
  );
};

export default App;