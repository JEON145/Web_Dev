import { ReactNode } from 'react';
import { Package, Repeat, Bell, User } from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-white md:top-0 md:bottom-0 md:w-64 md:flex-col md:border-r md:border-t-0">
        <div className="hidden items-center p-6 text-xl font-bold text-blue-600 md:flex">
          StoreExchange
        </div>
        
        <div className="flex w-full justify-around md:mt-10 md:flex-col md:justify-start md:space-y-4 md:px-4">
          <NavItem icon={<Package />} label="Inventory" />
          <NavItem icon={<Repeat />} label="Marketplace" />
          <NavItem icon={<Bell />} label="Alerts" />
          <NavItem icon={<User />} label="Profile" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600 md:flex-row md:space-x-4 md:rounded-lg md:px-4 md:py-3 md:hover:bg-blue-50">
    {icon}
    <span className="text-[10px] md:text-base">{label}</span>
  </button>
);