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
  
  // Estados de Zoom e Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  
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
        // Ajustar coordenadas considerando zoom e pan
        const adjustedX = (mouseX - pan.x) / zoom;
        const adjustedY = (mouseY - pan.y) / zoom;
        setDragOffset({
          x: adjustedX - node.position.x,
          y: adjustedY - node.position.y,
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
    
    // Pan do canvas
    if (isPanning) {
      const deltaX = x - panStart.x;
      const deltaY = y - panStart.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setPanStart({ x, y });
      return;
    }
    
    if (!draggingNodeId && !connecting) return;
    
    // Ajustar coordenadas considerando zoom e pan
    const adjustedX = (x - pan.x) / zoom;
    const adjustedY = (y - pan.y) / zoom;
    
    if (connecting) {
      setMousePos({ x: adjustedX, y: adjustedY });
    }

    if (draggingNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, position: { x: adjustedX - dragOffset.x, y: adjustedY - dragOffset.y } }
            : n
        )
      );
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setDraggingNodeId(null);
    setConnecting(null);
    setIsPanning(false);
    canvasBoundsRef.current = null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Iniciar pan com botão do meio ou clique direito
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
    
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Geometria ---

  const getHandlePosition = (nodeId: string, handleId: string, type: 'source' | 'target'): Position => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const list = type === 'source' ? node.outputs : node.inputs;
    const index = list.indexOf(handleId);
    
    if (index === -1) {
      // Retornar posição base do nó (sem transformação para uso interno)
      return { x: node.position.x, y: node.position.y };
    }

    const baseY = node.position.y + HANDLE_OFFSET_TOP + (index * HANDLE_SPACING) + (HANDLE_WIDTH_CONTAINER / 2);
    const HANDLE_CENTER_OFFSET = HANDLE_WIDTH_CONTAINER / 2;

    const baseX = type === 'source' 
      ? node.position.x + NODE_WIDTH + HANDLE_CENTER_OFFSET
      : node.position.x - HANDLE_CENTER_OFFSET;

    // Retornar posição base (sem transformação) para cálculos internos
    return { x: baseX, y: baseY };
  };

  const getHandlePositionTransformed = (nodeId: string, handleId: string, type: 'source' | 'target'): Position => {
    const basePos = getHandlePosition(nodeId, handleId, type);
    // Aplicar transformação de zoom e pan para renderização
    return { 
      x: (basePos.x * zoom) + pan.x, 
      y: (basePos.y * zoom) + pan.y 
    };
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
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Controles de Zoom */}
      <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2 bg-surface/90 backdrop-blur border border-border rounded-lg p-2 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/50 rounded transition-all"
          title="Zoom In (+)"
        >
          <span className="text-sm font-bold">+</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/50 rounded transition-all"
          title="Zoom Out (-)"
        >
          <span className="text-sm font-bold">−</span>
        </button>
        <button
          onClick={handleResetZoom}
          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/50 rounded transition-all text-xs"
          title="Reset Zoom (100%)"
        >
          100%
        </button>
        <div className="text-[10px] text-zinc-500 text-center pt-1 border-t border-border">
          {Math.round(zoom * 100)}%
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        <defs>
          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        
        {edges.map(edge => {
          const start = getHandlePositionTransformed(edge.source, edge.sourceHandle, 'source');
          const end = getHandlePositionTransformed(edge.target, edge.targetHandle, 'target');
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
           const startPos = getHandlePositionTransformed(connecting.nodeId, connecting.handleId, connecting.type);
           const endPos = { x: (mousePos.x * zoom) + pan.x, y: (mousePos.y * zoom) + pan.y };
           const { d } = getPathInfo(startPos, endPos);
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
      
      <div 
        className="relative z-10 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top left'
        }}
      >
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