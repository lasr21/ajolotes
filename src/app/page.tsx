export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-[390px] flex-col items-center gap-8 text-center">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-trajinera">
            Ajolotes en Producción
          </h1>
          <p className="text-lg text-lirio/90">
            Tu ajolote contra los bugs de JavaScript. 20 segundos.
          </p>
        </header>

        <div
          aria-hidden="true"
          className="h-40 w-[280px] rounded-3xl border-4 border-agua-profunda bg-agua-profunda/40"
        />

        <button
          type="button"
          disabled
          className="min-h-11 w-full rounded-2xl bg-trajinera px-6 py-3 text-lg font-semibold text-tinta disabled:cursor-not-allowed disabled:opacity-60"
        >
          Jugar
        </button>

        <p className="text-sm text-lirio/70">
          Un minijuego para JSConf MX 2026, Guadalajara.
        </p>
      </div>
    </main>
  );
}
