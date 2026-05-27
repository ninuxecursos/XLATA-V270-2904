import { ReactNode } from 'react';
import ResponsiveNavigation from '../ResponsiveNavigation';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone } from 'lucide-react';

interface BlogArticleLayoutProps {
  children: ReactNode;
}

export const BlogArticleLayout = ({ children }: BlogArticleLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <ResponsiveNavigation companyPhone="(11) 96351-2105" />
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/landing" className="flex items-center gap-2">
                <img src="/lovable-uploads/XLATALOGO.png" alt="XLata" className="h-8 w-auto" />
                <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">XLata</span>
              </Link>
              <p className="text-sm text-slate-500">
                Sistema completo para gestão de depósitos de reciclagem. Controle de caixa, compra, venda por kg e muito mais.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Portal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/blog" className="hover:text-emerald-600 transition-colors">Blog</Link></li>
                <li><Link to="/ajuda" className="hover:text-emerald-600 transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/solucoes" className="hover:text-emerald-600 transition-colors">Soluções</Link></li>
                <li><Link to="/glossario" className="hover:text-emerald-600 transition-colors">Glossário</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/planos" className="hover:text-emerald-600 transition-colors">Planos e Preços</Link></li>
                <li><Link to="/register" className="hover:text-emerald-600 transition-colors">Criar Conta</Link></li>
                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Fazer Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="https://wa.me/5511963512105?text=Olá! Gostaria de saber mais sobre o Sistema XLata.site." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    (11) 96351-2105
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} XLata - AIRK Soluções Digitais. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-slate-200 z-40">
        <Link to="/register">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg text-white" size="lg">
            Teste Grátis 7 Dias
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
