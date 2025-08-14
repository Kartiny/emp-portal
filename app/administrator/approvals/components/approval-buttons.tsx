
"use client";

import { Button } from "@/components/ui/button";

interface ApprovalButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  status: string;
}

export default function ApprovalButtons({ onApprove, onReject, status }: ApprovalButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); onApprove(); }}
        disabled={status === 'Approved' || status === 'Rejected'}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={(e) => { e.stopPropagation(); onReject(); }}
        disabled={status === 'Approved' || status === 'Rejected'}
      >
        Reject
      </Button>
    </div>
  );
}
