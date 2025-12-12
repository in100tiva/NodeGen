import React, { useState, useRef, useEffect } from 'react';
import { Node, Edge, Position } from '../types';
import NodeCard from './NodeCard';
import { IconUnlink } from './Icons';

interface NodeCanvasProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  isSimulating: boolean;
}

const NodeCanvas: React.FC<NodeCanvasProps> = ({ nodes, edges, setNodes, setEdges, onDeleteNode, onDuplicateNode, isSimulating }) => {
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ nodeId: string; handleId: string; pos: Position; type: 'source' | 'target' } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  
  // Estados de Seleção
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasBoundsRef = useRef<{ left: number, top: number } | null>(null);

  // Constantes de Layout
  const NODE_WIDTH = 256; 
  const HANDLE_OFFSET_TOP = 64; 
  const HANDLE_SPACING = 32;
  const HANDLE_WIDTH_CONTAINER = 24; 

  // --- Handlers de Nó ---

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      canvasBoundsRef.current = { left: rect.left, top: rect.top };
      
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDragOffset({
          x: mouseX - node.position.x,
          y: mouseY - node.position.y,
        });
      }
    }
    
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const handleUpdateNodeData = (nodeId: string, data: any) => {
    setNodes((prev) => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
  };

  // --- Handlers de Conexão ---

  const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string, handleId: string, type: 'source' | 'target') => {
    e.stopPropagation();
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      canvasBoundsRef.current = { left: rect.left, top: rect.top };
    }

    const startPos = getHandlePosition(nodeId, handleId, type);

    if (startPos) {
       setConnecting({ nodeId, handleId, pos: startPos, type });
       setSelectedEdgeId(null);
    }
  };

  const handleHandleMouseUp = (e: React.MouseEvent, targetNodeId: string, targetHandleId: string, type: 'source' | 'target') => {
      e.stopPropagation();
      e.preventDefault();

      if (connecting) {
          if (connecting.nodeId === targetNodeId) return;
          if (connecting.type === type) return;

          const exists = edges.some(edge => 
            (edge.source === connecting.nodeId && edge.target === targetNodeId && edge.sourceHandle === connecting.handleId && edge.targetHandle === targetHandleId) ||
            (edge.source === targetNodeId && edge.target === connecting.nodeId && edge.sourceHandle === targetHandleId && edge.targetHandle === connecting.handleId)
          );

          if (!exists) {
            const newEdge: Edge = {
              id: `e-${Date.now()}`,
              source: connecting.type === 'source' ? connecting.nodeId : targetNodeId,
              sourceHandle: connecting.type === 'source' ? connecting.handleId : targetHandleId,
              target: connecting.type === 'source' ? targetNodeId : connecting.nodeId,
              targetHandle: connecting.type === 'source' ? targetHandleId : connecting.handleId
            };
            setEdges(prev => [...prev, newEdge]);
          }
          
          setConnecting(null);
      }
  }

  // --- Handlers de Edge ---

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    // Não limpamos selectedNodeId aqui para manter o fluxo de edição fluido
  };

  // --- Movimento Global ---

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId && !connecting) return;

    let left = 0;
    let top = 0;

    if (canvasBoundsRef.current) {
      left = canvasBoundsRef.current.left;
      top = canvasBoundsRef.current.top;
    } else if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
    }
    
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    if (connecting) {
      setMousePos({ x, y });
    }

    if (draggingNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, position: { x: x - dragOffset.x, y: y - dragOffset.y } }
            : n
        )
      );
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setDraggingNodeId(null);
    setConnecting(null);
    canvasBoundsRef.current = null;
  };

  const handleCanvasMouseDown = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  // --- Geometria ---

  const getHandlePosition = (nodeId: string, handleId: string, type: 'source' | 'target'): Position => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const list = type === 'source' ? node.outputs : node.inputs;
    const index = list.indexOf(handleId);
    
    if (index === -1) return { x: node.position.x, y: node.position.y };

    const y = node.position.y + HANDLE_OFFSET_TOP + (index * HANDLE_SPACING) + (HANDLE_WIDTH_CONTAINER / 2);
    const HANDLE_CENTER_OFFSET = HANDLE_WIDTH_CONTAINER / 2;

    const x = type === 'source' 
      ? node.position.x + NODE_WIDTH + HANDLE_CENTER_OFFSET
      : node.position.x - HANDLE_CENTER_OFFSET;

    return { x, y };
  };

  const getPathInfo = (start: Position, end: Position) => {
    const deltaX = Math.abs(end.x - start.x);
    const controlX = Math.max(deltaX * 0.4, 60); 

    const p0 = start;
    const p1 = { x: start.x + controlX, y: start.y };
    const p2 = { x: end.x - controlX, y: end.y };
    const p3 = end;

    const pathData = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

    // Ponto médio da curva
    const t = 0.5;
    const mt = 1 - t;
    const midX = mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x;
    const midY = mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y;

    return { d: pathData, midX, midY };
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden bg-dot-pattern select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleCanvasMouseDown}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        <defs>
          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        
        {edges.map(edge => {
          const start = getHandlePosition(edge.source, edge.sourceHandle, 'source');
          const end = getHandlePosition(edge.target, edge.targetHandle, 'target');
          const { d, midX, midY } = getPathInfo(start, end);
          
          // Lógica de visualização:
          // A linha é destacada se ela estiver selecionada DIRETAMENTE
          // OU se ela estiver conectada ao NÓ selecionado atualmente.
          const isSelected = selectedEdgeId === edge.id;
          const isRelatedToSelectedNode = selectedNodeId ? (edge.source === selectedNodeId || edge.target === selectedNodeId) : false;
          
          const showControls = isSelected || isRelatedToSelectedNode;

          return (
            <g key={edge.id} className="pointer-events-auto group">
                {/* Linha transparente (Hitbox) */}
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth="30"
                  fill="none"
                  className="cursor-pointer"
                  onClick={(e) => handleEdgeClick(e, edge.id)}
                />

                {/* Linha de fundo (Contraste) */}
                <path
                  d={d}
                  stroke="#09090b"
                  strokeWidth={showControls ? "6" : "4"}
                  fill="none"
                  strokeLinecap="round" 
                  className="opacity-50"
                />
                
                {/* Linha Principal */}
                <path
                  d={d}
                  stroke={showControls ? "#ec4899" : "url(#gradient-line)"}
                  strokeWidth={showControls ? "3" : "2"}
                  fill="none"
                  strokeLinecap="round"
                  className={`pointer-events-none ${isSimulating ? 'animate-pulse-flow' : ''}`}
                  style={{
                    strokeDasharray: isSimulating ? '10 10' : '0',
                    filter: showControls ? 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.6))' : 'none'
                  }}
                />

                {/* Botão de Desconectar */}
                {/* Aparece se a linha estiver selecionada OU se o nó conectado estiver selecionado */}
                {showControls && (
                  <foreignObject 
                    x={midX - 16} 
                    y={midY - 16} 
                    width={32} 
                    height={32} 
                    className="overflow-visible pointer-events-auto"
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEdge(edge.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-red-500/50 text-red-500 hover:text-white hover:bg-red-500 rounded-full shadow-lg shadow-black/50 transition-transform animate-in zoom-in duration-200 hover:scale-110 cursor-pointer"
                        title="Desconectar"
                      >
                         <IconUnlink className="w-4 h-4" />
                      </button>
                    </div>
                  </foreignObject>
                )}
            </g>
          );
        })}

        {connecting && (() => {
           const { d } = getPathInfo(connecting.pos, mousePos);
           return (
              <path 
                d={d}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                className="opacity-80"
              />
          )
        })()}
      </svg>
      
      <div className="relative z-10 w-full h-full pointer-events-none">
        {nodes.map(node => (
          <div key={node.id} className="pointer-events-auto">
            <NodeCard
              node={node}
              isSelected={selectedNodeId === node.id}
              onMouseDown={handleNodeMouseDown}
              onHandleMouseDown={handleHandleMouseDown}
              onHandleMouseUp={handleHandleMouseUp}
              onUpdateData={handleUpdateNodeData}
              onDelete={() => onDeleteNode(node.id)}
              onDuplicate={() => onDuplicateNode(node.id)}
            />
          </div>
        ))}
      </div>

      <style>{`
        .bg-dot-pattern {
          background-color: #09090b;
          background-image: radial-gradient(#27272a 1px, transparent 1px);
          background-size: 24px 24px;
        }
        @keyframes pulse-flow {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-pulse-flow {
          animation: pulse-flow 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NodeCanvas;