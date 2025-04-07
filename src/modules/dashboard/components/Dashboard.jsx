import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChartPieIcon, CurrencyPoundIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import PageHeader from '@/modules/core/components/PageHeader';
import LoadingSpinner from '@/modules/core/components/LoadingSpinner';
import * as Sentry from '@sentry/browser';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log("Fetching dashboard data...");
        
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        console.log("Dashboard data received:", data);
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
        Sentry.captureException(error, {
          extra: {
            component: 'Dashboard',
            action: 'fetchDashboardData'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="large" message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-medium text-red-600 mb-4">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare data for engagement status chart
  const statusData = {
    labels: dashboardData.engagementStatusCounts.map(item => item.status || 'Undefined'),
    datasets: [
      {
        data: dashboardData.engagementStatusCounts.map(item => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        description="Overview of GMFEIP programme engagement" 
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Companies Card */}
        <div className="card p-6">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Companies</h3>
              <p className="text-3xl font-bold">{dashboardData.companiesCount}</p>
              <p className="text-sm text-gray-500">Total companies engaged</p>
            </div>
          </div>
        </div>
        
        {/* Engagements Card */}
        <div className="card p-6">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <ChartPieIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Engagements</h3>
              <p className="text-3xl font-bold">{dashboardData.engagementsCount}</p>
              <p className="text-sm text-gray-500">Total engagement activities</p>
            </div>
          </div>
        </div>
        
        {/* Value Card */}
        <div className="card p-6">
          <div className="flex items-start">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CurrencyPoundIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
              <p className="text-3xl font-bold">£{dashboardData.totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-500">Value to college</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Engagement Status Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Engagement Status</h3>
          </div>
          <div className="card-body h-64 flex items-center justify-center">
            <Doughnut 
              data={statusData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Upcoming Tasks</h3>
          </div>
          <div className="card-body">
            {dashboardData.upcomingTasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {dashboardData.upcomingTasks.map((task) => (
                  <li key={task.id} className="py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{task.task}</p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${task.completed ? 'badge-green' : 'badge-yellow'}`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-gray-500">No upcoming tasks</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Companies */}
      <div className="card mb-6">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-medium">Recent Companies</h3>
          <Link to="/companies" className="text-sm text-blue-600 hover:text-blue-500">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      <Link to={`/companies/${company.id}`} className="hover:text-blue-600">
                        {company.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.industry || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.location || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.contactName || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;