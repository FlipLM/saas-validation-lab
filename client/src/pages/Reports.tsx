import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Report, Project } from '../types/index.js';
import { 
  FileText, 
  Download, 
  Plus, 
  Layers, 
  FileCode, 
  Activity
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports(selectedProjectId || undefined);
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProjectId) {
      alert('Selecione um projeto para gerar o relatório.');
      return;
    }
    try {
      setGenerating(true);
      const newRep = await api.generateReport(selectedProjectId);
      await loadReports();
      setSelectedReport(newRep);
    } catch (err: any) {
      alert(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (reportId: string, format: 'md' | 'json') => {
    window.open(`/api/reports/${reportId}/download/${format}`, '_blank');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-500" />
            <span>Central de Relatórios de Auditoria</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Consolidação de evidências auditadas, descobertas confirmadas e exportação em Markdown e JSON.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{generating ? 'Consolidando...' : 'Gerar Novo Relatório'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Nenhum relatório emitido</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere o primeiro relatório técnico consolidando as evidências e descobertas do projeto selecionado.
          </p>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Gerar Relatório Agora
          </button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* List of Reports (Left Column) */}
          <div className="glass-panel p-4 rounded-xl flex flex-col space-y-2 overflow-y-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Relatórios Emitidos ({reports.length})
            </span>
            {reports.map(rep => {
              const isSelected = selectedReport?.id === rep.id;
              let countObj: any = {};
              try { countObj = JSON.parse(rep.findings_count); } catch {}

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition text-xs space-y-2 ${
                    isSelected 
                      ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-sm' 
                      : 'bg-surface-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-xs line-clamp-1">{rep.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(rep.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{rep.summary}</p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="text-rose-400 font-bold">{countObj.critical || 0} Crit</span>
                    <span className="text-orange-400 font-bold">{countObj.high || 0} Alta</span>
                    <span className="text-amber-400 font-bold">{countObj.medium || 0} Méd</span>
                    <span className="text-slate-400 ml-auto">{rep.project_name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Viewer (Right Columns) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col space-y-4 overflow-hidden">
            {selectedReport ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      ID: {selectedReport.id} • Emissão: {new Date(selectedReport.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile(selectedReport.id, 'md')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-400" />
                      <span>report.md</span>
                    </button>
                    <button
                      onClick={() => downloadFile(selectedReport.id, 'json')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      <span>report.json</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Content Display */}
                <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-surface-950/80 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-brand-600">
                  {selectedReport.raw_content_md}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Selecione um relatório na lista para visualizar o conteúdo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
