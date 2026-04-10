import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Bot } from 'lucide-react';
import type { NodeData } from '../types';

const MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o mini (fast)' },
  { id: 'gpt-4o', label: 'GPT-4o (smart)' },
  { id: 'o4-mini', label: 'o4-mini (reasoning)' },
];

export function AgentNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { setNodes } = useReactFlow();

  const update = (patch: Partial<NodeData>) =>
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));

  const statusClass = data.status ?? 'idle';

  return (
    <div className={`ao-node ${selected ? 'selected' : ''} ${statusClass !== 'idle' ? statusClass : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="ao-node-header" style={{ color: '#a78bfa' }}>
        <div className="ao-node-icon" style={{ background: 'rgba(167,139,250,0.15)' }}>
          <Bot size={12} color="#a78bfa" />
        </div>
        <span style={{ flex: 1 }}>Agent</span>
        <div className={`status-dot ${statusClass}`} />
      </div>
      <div className="ao-node-body">
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>LABEL</div>
        <input
          type="text"
          value={data.label}
          onChange={e => update({ label: e.target.value })}
          style={{ marginBottom: 8 }}
          placeholder="Agent name"
        />
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>SYSTEM PROMPT</div>
        <textarea
          rows={4}
          value={data.systemPrompt ?? ''}
          onChange={e => update({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant that…"
          style={{ marginBottom: 8 }}
        />
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>MODEL</div>
        <select
          value={data.model ?? MODELS[0].id}
          onChange={e => update({ model: e.target.value })}
          style={{
            background: '#13131e', border: '1px solid #2d2d3f',
            borderRadius: 6, color: '#e2e8f0', fontSize: 12, padding: '6px 8px',
            width: '100%', outline: 'none',
          }}
        >
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {data.output && (
          <>
            <div style={{ fontSize: 10, color: '#6b7280', margin: '8px 0 4px' }}>OUTPUT</div>
            <div className="output-text">{data.output}</div>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
