import { CreateTournamentForm } from '@/components/tournament/CreateTournamentForm';

export default function NewTournamentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Tournament</h1>
        <p className="text-muted-foreground">
          Set up a new karate tournament and define its categories.
        </p>
      </div>
      <CreateTournamentForm />
    </div>
  );
}
