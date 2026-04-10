import { useState, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import { InputNode } from './nodes/InputNode';
import { AgentNode } from './nodes/AgentNode';
import { TransformNode } from './nodes/TransformNode';
import { OutputNode } from './nodes/OutputNode';
import { Toolbar } from './Toolbar';
import { SettingsModal } from './SettingsModal';
import { usePipeline } from './usePipeline';
import { getApiKey } from './claude';
import type { NodeData } from './types';

const nodeTypes = {
  input: InputNode,
  agent: AgentNode,
  transform: TransformNode,
  output: OutputNode,
};

const EXAMPLE_NODES: Node<NodeData>[] = [
  {
    id: 'n1',
    type: 'input',
    position: { x: 320, y: 60 },
    data: { kind: 'input', label: 'Topic', value: 'The future of AI agents in software development' },
  },
  {
    id: 'n2',
    type: 'agent',
    position: { x: 100, y: 240 },
    data: {
      kind: 'agent', label: 'Summariser',
      systemPrompt: 'You are a concise summariser. Write a 3-sentence summary of the given topic.',
      model: 'gpt-4o-mini',
    },
  },
  {
    id: 'n3',
    type: 'agent',
    position: { x: 440, y: 240 },
    data: {
      kind: 'agent', label: 'Critic',
      systemPrompt: 'You are a sharp analyst. List 3 counterarguments or risks about the given topic.',
      model: 'gpt-4o-mini',
    },
  },
  {
    id: 'n4',
    type: 'transform',
    position: { x: 260, y: 460 },
    data: {
      kind: 'transform', label: 'Synthesiser',
      transformPrompt: 'Synthesise the following inputs into one coherent, balanced 5-sentence paragraph.',
    },
  },
  {
    id: 'n5',
    type: 'output',
    position: { x: 260, y: 640 },
    data: { kind: 'output', label: 'Final Output' },
  },
];

const EXAMPLE_EDGES: Edge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
  { id: 'e1-3', source: 'n1', target: 'n3', animated: true },
  { id: 'e2-4', source: 'n2', target: 'n4', animated: true },
  { id: 'e3-4', source: 'n3', target: 'n4', animated: true },
  { id: 'e4-5', source: 'n4', target: 'n5', animated: true },
];

let nodeCounter = 10;

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(EXAMPLE_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(EXAMPLE_EDGES);
  const [showSettings, setShowSettings] = useState(!getApiKey());
  const [running, setRunning] = useState(false);
  const [hasKey, setHasKey] = useState(!!getApiKey());

  const { runPipeline } = usePipeline();

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addNode = (kind: string) => {
    const id = `n${++nodeCounter}`;
    const defaults: Record<string, Partial<NodeData>> = {
      input:     { label: 'Input', value: '' },
      agent:     { label: 'Agent', systemPrompt: 'You are a helpful assistant.', model: 'gpt-4o-mini' },
      transform: { label: 'Transform', transformPrompt: '' },
      output:    { label: 'Output' },
    };
    const newNode: Node<NodeData> = {
      id,
      type: kind,
      position: { x: 180 + Math.random() * 320, y: 140 + Math.random() * 180 },
      data: { kind: kind as NodeData['kind'], ...defaults[kind] } as NodeData,
    };
    setNodes(ns => [...ns, newNode]);
  };

  const clearCanvas = () => {
    if (!confirm('Clear all nodes and edges?')) return;
    setNodes([]);
    setEdges([]);
  };

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      await runPipeline();
    } finally {
      setRunning(false);
    }
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    setHasKey(!!getApiKey());
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        background: 'rgba(10,10,15,0.92)', borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 20,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>🎼</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>AgentOrchestra</span>
          <span style={{
            fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 600,
          }}>beta</span>
        </div>
        <span style={{ marginLeft: 16, fontSize: 12, color: '#4a4a6a', display: 'none' }}>
          Visual multi-agent pipeline designer
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!hasKey && (
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚠ Add API Key
            </button>
          )}
          <span style={{ fontSize: 11, color: '#2d2d3f' }}>
            Delete key to remove nodes • Shift+click to multi-select
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ paddingTop: 52, height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          minZoom={0.3}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={24} size={1.5} />
          <Controls style={{ bottom: 20, left: 20 }} />
          <MiniMap
            nodeColor={n => {
              const c: Record<string, string> = {
                input: '#60a5fa', agent: '#a78bfa', transform: '#34d399', output: '#fb923c',
              };
              return c[n.type ?? ''] ?? '#6b7280';
            }}
            maskColor="rgba(10,10,15,0.7)"
            style={{ bottom: 20, right: 20, borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      <Toolbar
        onAdd={addNode}
        onRun={handleRun}
        onClear={clearCanvas}
        onSettings={() => setShowSettings(true)}
        running={running}
        hasKey={hasKey}
      />

      {showSettings && <SettingsModal onClose={handleSettingsClose} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
