import { Section, Button } from '@/components/ui';

export default function NotFound() {
  return (
    <Section className="text-center">
      <p className="font-serif text-6xl font-bold text-teal/40">404</p>
      <h1 className="mt-2 text-h2">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-500">
        This placeholder route doesn't exist. Head back home to keep exploring the scaffold.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button href="/" variant="primary">Back home</Button>
        <Button href="/programs" variant="secondary">See programs</Button>
      </div>
    </Section>
  );
}
