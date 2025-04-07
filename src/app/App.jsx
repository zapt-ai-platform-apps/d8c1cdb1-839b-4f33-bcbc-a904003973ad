import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/modules/dashboard/components/Dashboard';
import Layout from '@/modules/core/components/Layout';
import CompanyList from '@/modules/companies/components/CompanyList';
import CompanyDetail from '@/modules/companies/components/CompanyDetail';
import CompanyForm from '@/modules/companies/components/CompanyForm';
import ResourceList from '@/modules/resources/components/ResourceList';
import ResourceForm from '@/modules/resources/components/ResourceForm';
import ResourceDistribution from '@/modules/resources/components/ResourceDistribution';
import NotFound from '@/modules/core/components/NotFound';
import { ZaptBadge } from '@/modules/core/components/ZaptBadge';

const App = () => {
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