import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from '@xyflow/react';
import { X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import fieldsData from './fieldsData.json';

// =========================================================================
// COMMENT: Important logic block mapping GLPI sections to React Flow nodes.
// =========================================================================
const initialNodes = [
  { id: '1', position: { x: 400, y: 0 }, data: { label: 'Início do Formulário' }, style: { backgroundColor: '#f3f4f6', fontWeight: 'bold' } },
  { id: '2', position: { x: 400, y: 100 }, data: { label: 'Segurança da Informação' } },
  { id: '3', position: { x: 400, y: 200 }, data: { label: 'Tipo de contratação' } },
  
  { id: '4', position: { x: 400, y: 300 }, data: { label: 'Qual o tipo de contratação?' }, type: 'input', style: { backgroundColor: '#e1f5fe', borderColor: '#03a9f4' } },

  // Branches
  { id: 'clt', position: { x: 100, y: 450 }, data: { label: 'Adicionais CLT' }, style: { backgroundColor: '#e0f2f1' } },
  { id: 'pj', position: { x: 300, y: 450 }, data: { label: 'Adicionais PJ e COOPERADOS' }, style: { backgroundColor: '#fce4ec' } },
  { id: 'estagiario', position: { x: 500, y: 450 }, data: { label: 'Estagiário (Fluxo Padrão)' }, style: { backgroundColor: '#fff8e1' } },
  { id: 'rpa', position: { x: 800, y: 450 }, data: { label: 'Contratação RPA' }, style: { backgroundColor: '#ede7f6' } },

  // Merge back for non-RPA
  { id: 'dados-pessoais', position: { x: 300, y: 600 }, data: { label: 'Dados Pessoais' } },
  { id: 'info-cliente', position: { x: 300, y: 700 }, data: { label: 'Informações do Cliente' } },

  // Main Merge
  { id: 'gerais', position: { x: 500, y: 850 }, data: { label: 'Dados Contratuais\nRecursos\nAcesso a Sistemas\nObservações\nAnexos' }, style: { backgroundColor: '#e8f5e9' } },

  // Subconditions from Recursos/Sistemas
  { id: 'cond-recursos', position: { x: 500, y: 950 }, data: { label: 'Recursos / Sistemas Selecionados?' }, style: { backgroundColor: '#e1f5fe', borderColor: '#03a9f4' } },
  { id: 'epi', position: { x: 100, y: 1100 }, data: { label: 'Solicitação de EPIS/Uniformes' }, style: { backgroundColor: '#fff3e0', borderStyle: 'dashed' } },
  { id: 'tic', position: { x: 350, y: 1100 }, data: { label: 'Recursos TIC (Equipamentos)' }, style: { backgroundColor: '#fff3e0', borderStyle: 'dashed' } },
  { id: 'bullhorn', position: { x: 600, y: 1100 }, data: { label: 'BULLHORN - Parâmetros' }, style: { backgroundColor: '#fff3e0', borderStyle: 'dashed' } },
  { id: 'rydoo', position: { x: 850, y: 1100 }, data: { label: 'RYDOO - Formulário' }, style: { backgroundColor: '#fff3e0', borderStyle: 'dashed' } },
  
  // Condição final
  { id: 'merge-recursos', position: { x: 500, y: 1250 }, data: { label: 'Continuação do fluxo' } },
  { id: 'cond-rpa-final', position: { x: 500, y: 1350 }, data: { label: 'É RPA?' }, style: { backgroundColor: '#e1f5fe', borderColor: '#03a9f4' } },
  
  { id: 'indicacao', position: { x: 300, y: 1500 }, data: { label: 'INDICAÇÃO PREMIADA!' } },
  { id: 'end', position: { x: 500, y: 1650 }, data: { label: 'Fim do Formulário' }, style: { backgroundColor: '#f3f4f6', fontWeight: 'bold' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: '2', target: '3', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: '3', target: '4', markerEnd: { type: MarkerType.ArrowClosed } },
  
  // Branches
  { id: 'e4-clt', source: '4', target: 'clt', label: 'CLT', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-pj', source: '4', target: 'pj', label: 'PJ / Cooperado', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-estagiario', source: '4', target: 'estagiario', label: 'Estagiário', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-rpa', source: '4', target: 'rpa', label: 'RPA', markerEnd: { type: MarkerType.ArrowClosed } },

  // To Pessoais
  { id: 'e-clt-pes', source: 'clt', target: 'dados-pessoais', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-pj-pes', source: 'pj', target: 'dados-pessoais', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-est-pes', source: 'estagiario', target: 'dados-pessoais', markerEnd: { type: MarkerType.ArrowClosed } },
  
  { id: 'e-pes-inf', source: 'dados-pessoais', target: 'info-cliente', markerEnd: { type: MarkerType.ArrowClosed } },
  
  // To Gerais
  { id: 'e-inf-ger', source: 'info-cliente', target: 'gerais', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-rpa-ger', source: 'rpa', target: 'gerais', markerEnd: { type: MarkerType.ArrowClosed } },

  // Cond Recursos
  { id: 'e-ger-cond', source: 'gerais', target: 'cond-recursos', markerEnd: { type: MarkerType.ArrowClosed } },

  { id: 'e-cond-epi', source: 'cond-recursos', target: 'epi', label: 'EPI/Uniforme', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-cond-tic', source: 'cond-recursos', target: 'tic', label: 'DEXIAN (TIC)', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-cond-bull', source: 'cond-recursos', target: 'bullhorn', label: 'Bullhorn', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-cond-rydoo', source: 'cond-recursos', target: 'rydoo', label: 'Rydoo', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },

  { id: 'e-cond-none', source: 'cond-recursos', target: 'merge-recursos', label: 'Nenhum', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-epi-merge', source: 'epi', target: 'merge-recursos', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-tic-merge', source: 'tic', target: 'merge-recursos', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-bull-merge', source: 'bullhorn', target: 'merge-recursos', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-rydoo-merge', source: 'rydoo', target: 'merge-recursos', markerEnd: { type: MarkerType.ArrowClosed } },

  // RPA Final Check
  { id: 'e-merge-rpa', source: 'merge-recursos', target: 'cond-rpa-final', markerEnd: { type: MarkerType.ArrowClosed } },
  
  { id: 'e-rpafin-nao', source: 'cond-rpa-final', target: 'indicacao', label: 'Não', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-rpafin-sim', source: 'cond-rpa-final', target: 'end', label: 'Sim', markerEnd: { type: MarkerType.ArrowClosed } },
  
  { id: 'e-ind-end', source: 'indicacao', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string } | null>(null);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode({ id: node.id, label: node.data.label as string });
  }, []);

  const closePanel = () => setSelectedNode(null);

  const activeFields = selectedNode && fieldsData[selectedNode.id as keyof typeof fieldsData] 
    ? fieldsData[selectedNode.id as keyof typeof fieldsData] 
    : [];

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      <header className="p-4 bg-slate-900 text-slate-50 flex justify-between items-center shadow-md z-10">
        <h1 className="text-2xl font-bold tracking-tight">GLPI Process Viewer</h1>
        <p className="text-sm opacity-80">Flowchart baseado no formulário Contratação</p>
      </header>
      <main className="flex-1 w-full h-full relative flex">
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
          >
            <MiniMap />
            <Controls />
            <Background color="#ccc" gap={16} />
          </ReactFlow>
        </div>
        
        {/* Side Panel for Drill Down */}
        <aside 
          className={`absolute top-0 right-0 h-full bg-white shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-in-out z-20 flex flex-col w-96 ${
            selectedNode ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 line-clamp-1" title={selectedNode?.label}>
              {selectedNode?.label || 'Detalhes do Nó'}
            </h2>
            <button 
              onClick={closePanel} 
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {!selectedNode ? null : activeFields.length === 0 ? (
              <div className="text-slate-500 text-center mt-10">
                Nenhum campo associado diretamente a esta etapa no formulário, ou é apenas um nó condicional.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-500 mb-4">
                  {activeFields.length} campo(s) encontrados para esta etapa.
                </div>
                {activeFields.map((field, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      {field.section}
                    </div>
                    <div className="font-medium text-slate-700">
                      {field.name}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {field.type.replace('QuestionType', '')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
