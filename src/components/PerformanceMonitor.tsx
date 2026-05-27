// FASE 5: MONITORAMENTO E MÉTRICAS EM TEMPO REAL
// Componente para observabilidade e profiling de performance

import React, { useState, useEffect, useRef, memo } from 'react';
import { createLogger } from '@/utils/performanceUtils';
import { createPerformanceMonitor } from '@/utils/ultraPerformanceUtils';
import { scheduleUltraTask } from '@/utils/ultraPerformanceUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const logger = createLogger('[PerformanceMonitor]');

interface PerformanceMetrics {
  renders: number;
  updates: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  errorCount: number;
  cacheHitRate: number;
}

interface ComponentMetrics {
  name: string;
  renderCount: number;
  totalTime: number;
  averageTime: number;
  lastRender: number;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  network: number;
  overall: 'healthy' | 'warning' | 'critical';
}

const PerformanceMonitorComponent: React.FC<{ isVisible?: boolean }> = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renders: 0,
    updates: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    connectionQuality: 'good',
    errorCount: 0,
    cacheHitRate: 0
  });

  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 0,
    memory: 0,
    network: 0,
    overall: 'healthy'
  });

  const [isCollecting, setIsCollecting] = useState(false);
  const performanceMonitor = useRef(createPerformanceMonitor());
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const componentObserver = useRef(new Map<string, ComponentMetrics>());

  // Coleta de métricas de performance
  const collectMetrics = React.useCallback(() => {
    try {
      // Métricas do monitor
      const monitorMetrics = performanceMonitor.current.getMetrics();
      
      // Métricas de memória
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100) : 0;

      // Métricas de conexão
      const connection = (navigator as any).connection;
      const connectionQuality = connection ? 
        getConnectionQuality(connection.effectiveType, connection.rtt) : 'good';

      // Atualizar métricas
      setMetrics(prev => ({
        ...prev,
        ...monitorMetrics,
        memoryUsage,
        connectionQuality
      }));

      // Métricas de componentes
      const componentsArray = Array.from(componentObserver.current.values())
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 10);
      
      setComponentMetrics(componentsArray);

      // Saúde do sistema
      const health = calculateSystemHealth(memoryUsage, monitorMetrics.averageRenderTime);
      setSystemHealth(health);

      logger.log('Métricas coletadas:', { monitorMetrics, memoryUsage, health });

    } catch (error) {
      logger.error('Erro ao coletar métricas:', error);
    }
  }, []);

  // Avaliar qualidade da conexão
  const getConnectionQuality = (effectiveType: string, rtt: number): PerformanceMetrics['connectionQuality'] => {
    if (!effectiveType) return 'offline';
    
    if (effectiveType === '4g' && rtt < 100) return 'excellent';
    if (effectiveType === '4g' && rtt < 300) return 'good';
    if (effectiveType === '3g' || rtt < 500) return 'poor';
    return 'offline';
  };

  // Calcular saúde geral do sistema
  const calculateSystemHealth = (memory: number, renderTime: number): SystemHealth => {
    const memoryScore = memory > 80 ? 0 : memory > 60 ? 50 : 100;
    const performanceScore = renderTime > 100 ? 0 : renderTime > 50 ? 50 : 100;
    const overallScore = (memoryScore + performanceScore) / 2;
    
    return {
      cpu: Math.max(0, 100 - renderTime),
      memory: Math.max(0, 100 - memory),
      network: 100, // Simplificado
      overall: overallScore > 70 ? 'healthy' : overallScore > 40 ? 'warning' : 'critical'
    };
  };

  // Instrumentação de componentes React
  const instrumentComponent = React.useCallback((componentName: string, renderTime: number) => {
    const existing = componentObserver.current.get(componentName) || {
      name: componentName,
      renderCount: 0,
      totalTime: 0,
      averageTime: 0,
      lastRender: 0
    };

    const updated: ComponentMetrics = {
      ...existing,
      renderCount: existing.renderCount + 1,
      totalTime: existing.totalTime + renderTime,
      averageTime: (existing.totalTime + renderTime) / (existing.renderCount + 1),
      lastRender: Date.now()
    };

    componentObserver.current.set(componentName, updated);
  }, []);

  // Iniciar/parar coleta
  const toggleCollection = React.useCallback(() => {
    if (isCollecting) {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      setIsCollecting(false);
      logger.log('Coleta de métricas parada');
    } else {
      collectMetrics();
      metricsIntervalRef.current = setInterval(collectMetrics, 2000);
      setIsCollecting(true);
      logger.log('Coleta de métricas iniciada');
    }
  }, [isCollecting, collectMetrics]);

  // Reset das métricas
  const resetMetrics = React.useCallback(() => {
    performanceMonitor.current.reset();
    componentObserver.current.clear();
    setMetrics({
      renders: 0,
      updates: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
      connectionQuality: 'good',
      errorCount: 0,
      cacheHitRate: 0
    });
    setComponentMetrics([]);
    logger.log('Métricas resetadas');
  }, []);

  // Auto-start quando visível
  useEffect(() => {
    if (isVisible && !isCollecting) {
      scheduleUltraTask(() => {
        toggleCollection();
      }, 'normal');
    }
  }, [isVisible, isCollecting, toggleCollection]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  // Observador de performance global
  useEffect(() => {
    // Observar Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            const componentName = entry.name.replace('React ', '');
            instrumentComponent(componentName, entry.duration);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        logger.warn('PerformanceObserver não suportado:', error);
      }

      return () => observer.disconnect();
    }
  }, [instrumentComponent]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-background/95 backdrop-blur border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Performance Monitor
            <div className="flex gap-2">
              <Badge variant={systemHealth.overall === 'healthy' ? 'default' : 
                             systemHealth.overall === 'warning' ? 'secondary' : 'destructive'}>
                {systemHealth.overall}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCollection}
                className="h-6 px-2"
              >
                {isCollecting ? '⏸️' : '▶️'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={resetMetrics}
                className="h-6 px-2"
              >
                🔄
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Métricas principais */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-muted-foreground">Renders</div>
              <div className="font-mono">{metrics.renders}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Time</div>
              <div className="font-mono">{metrics.averageRenderTime.toFixed(1)}ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">Memory</div>
              <div className="font-mono">{metrics.memoryUsage}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Connection</div>
              <Badge variant={metrics.connectionQuality === 'excellent' ? 'default' :
                             metrics.connectionQuality === 'good' ? 'secondary' : 'destructive'}
                     className="text-xs">
                {metrics.connectionQuality}
              </Badge>
            </div>
          </div>

          {/* Saúde do sistema */}
          <div>
            <div className="text-muted-foreground mb-1">System Health</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>CPU</span>
                <span className="font-mono">{systemHealth.cpu}%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory</span>
                <span className="font-mono">{systemHealth.memory}%</span>
              </div>
            </div>
          </div>

          {/* Top componentes */}
          {componentMetrics.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Slowest Components</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {componentMetrics.slice(0, 3).map((comp, idx) => (
                  <div key={comp.name} className="flex justify-between text-xs">
                    <span className="truncate">{comp.name}</span>
                    <span className="font-mono">{comp.averageTime.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status da coleta */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCollecting ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs">{isCollecting ? 'Collecting' : 'Stopped'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const PerformanceMonitor = memo(PerformanceMonitorComponent);
PerformanceMonitor.displayName = 'PerformanceMonitor';

// Hook para usar o monitor de performance em componentes
export const usePerformanceMonitor = () => {
  const monitor = useRef(createPerformanceMonitor());
  
  const startRender = React.useCallback(() => {
    monitor.current.startRender();
  }, []);
  
  const endRender = React.useCallback(() => {
    monitor.current.endRender();
  }, []);
  
  const recordUpdate = React.useCallback(() => {
    monitor.current.recordUpdate();
  }, []);
  
  const getMetrics = React.useCallback(() => {
    return monitor.current.getMetrics();
  }, []);
  
  return {
    startRender,
    endRender,
    recordUpdate,
    getMetrics
  };
};