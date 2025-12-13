import React from 'react';

interface NodeCommentBadgeProps {
  nodeId: string;
}

const NodeCommentBadge: React.FC<NodeCommentBadgeProps> = ({ nodeId }) => {
  // TODO: Implementar quando comments.ts estiver disponível
  const commentCount = 0; // Placeholder

  if (commentCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[8px] rounded-full flex items-center justify-center">
      {commentCount > 9 ? '9+' : commentCount}
    </span>
  );
};

export default NodeCommentBadge;
