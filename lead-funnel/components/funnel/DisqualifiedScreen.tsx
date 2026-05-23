import { Button } from "@/components/ui/Button";

interface Props {
  onRestart: () => void;
}

export function DisqualifiedScreen({ onRestart }: Props) {
  return (
    <div className="text-center py-8 animate-fade-in">
      <div className="text-5xl mb-4">😔</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">
        Not Quite Ready Yet
      </h2>
      <p className="text-slate-600 max-w-md mx-auto mb-6">
        Based on your answers, you don&apos;t currently meet our contract partner
        requirements. This program is designed for active, licensed businesses.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 max-w-md mx-auto">
        <strong>What to do next:</strong> Get your business licensed and insured,
        build a few initial clients, then come back and apply. Many of our top
        partners started in your exact position.
      </div>
      <Button variant="outline" onClick={onRestart}>
        ← Start Over
      </Button>
    </div>
  );
}
