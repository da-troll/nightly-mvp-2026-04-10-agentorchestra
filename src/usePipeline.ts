import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from './types';
import { callClaude } from './claude';

function topoSort(nodes: Node<NodeData>[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const d = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return order;
}

function getUpstreamOutput(
  nodeId: string,
  edges: Edge[],
  outputs: Map<string, string>,
  nodes: Node<NodeData>[],
): string {
  const sources = edges
    .filter(e => e.target === nodeId)
    .map(e => e.source);

  if (sources.length === 0) return '';

  const parts: string[] = [];
  for (const src of sources) {
    const n = nodes.find(n => n.id === src);
    const label = n?.data?.label ?? src;
    const out = outputs.get(src) ?? '';
    parts.push(`[${label}]\n${out}`);
  }
  return parts.join('\n\n');
}

export function usePipeline() {
  const { getNodes, getEdges, setNodes } = useReactFlow<Node<NodeData>>();

  const setNodeStatus = useCallback(
    (id: string, status: NodeData['status'], output?: string) => {
      setNodes(nodes =>
        nodes.map(n =>
          n.id === id
            ? { ...n, data: { ...n.data, status, ...(output !== undefined ? { output } : {}) } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const runPipeline = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();
    const order = topoSort(nodes, edges);

    // Reset all statuses
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, status: 'idle' as const, output: '' } })));

    const outputs = new Map<string, string>();

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      const { kind, value, systemPrompt, transformPrompt, model } = node.data;

      if (kind === 'input') {
        const out = value ?? '';
        outputs.set(nodeId, out);
        setNodeStatus(nodeId, 'done', out);
        continue;
      }

      if (kind === 'output') {
        const upstream = getUpstreamOutput(nodeId, edges, outputs, nodes);
        outputs.set(nodeId, upstream);
        setNodeStatus(nodeId, 'done', upstream);
        continue;
      }

      if (kind === 'agent' || kind === 'transform') {
        setNodeStatus(nodeId, 'running');
        const upstream = getUpstreamOutput(nodeId, edges, outputs, nodes);
        const prompt = kind === 'transform' ? (transformPrompt ?? '') : (systemPrompt ?? '');
        const userMsg = upstream || '(no input)';

        try {
          const result = await callClaude(prompt, userMsg, model ?? 'gpt-4o-mini');
          outputs.set(nodeId, result);
          setNodeStatus(nodeId, 'done', result);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          outputs.set(nodeId, `Error: ${msg}`);
          setNodeStatus(nodeId, 'error', `Error: ${msg}`);
        }
      }
    }
  }, [getNodes, getEdges, setNodes, setNodeStatus]);

  return { runPipeline };
}
