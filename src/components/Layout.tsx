import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;