import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import ReferralSystemComponent from '@/components/ReferralSystem';

const ReferralSystemPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <header className="bg-pdv-dark text-white p-4 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar ao Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Sistema de Indicações
          </h1>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Sistema de Indicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReferralSystemComponent />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReferralSystemPage;