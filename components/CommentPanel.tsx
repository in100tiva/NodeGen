import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { IconX } from './Icons';

interface CommentPanelProps {
  workflowId: Id<'workflows'>;
  nodeId: string | null;
  onClose: () => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ workflowId, nodeId, onClose }) => {
  const [newComment, setNewComment] = useState('');
  const comments: any[] = []; // TODO: Implementar quando comments.ts estiver disponível
  // const createComment = useMutation(api.comments.createComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // TODO: Implementar quando comments.ts estiver disponível
    alert('Funcionalidade de comentários em desenvolvimento');
    setNewComment('');
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-white">Comentários</h3>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment: any) => (
          <div key={comment._id} className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-sm text-white mb-1">{comment.content}</p>
            <p className="text-xs text-zinc-400">
              {new Date(comment.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-zinc-400 text-sm text-center py-8">
            Nenhum comentário ainda.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent resize-none"
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default CommentPanel;
