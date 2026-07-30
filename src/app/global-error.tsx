"use client";

/**
 * Último recurso: se muestra si falla el layout raíz completo, así que no
 * puede depender de estilos globales ni componentes propios — HTML mínimo
 * con estilos en línea, como la página del revalidador.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f7f5",
          color: "#0a1128",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.4rem", margin: ".5rem 0" }}>
            No pudimos cargar la página de Actimax
          </h1>
          <p style={{ color: "#555" }}>Fue un error nuestro. Inténtalo de nuevo en un momento.</p>
          <p style={{ marginTop: "1.5rem" }}>
            <button
              onClick={() => reset()}
              style={{
                border: "none",
                background: "#002f87",
                color: "#fff",
                padding: ".6rem 1.4rem",
                borderRadius: "4px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </p>
        </main>
      </body>
    </html>
  );
}
