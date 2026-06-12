export function Toast({
  ok,
  error
}: {
  ok?: string | string[];
  error?: string | string[];
}) {
  const okMessage = Array.isArray(ok) ? ok[0] : ok;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  if (!okMessage && !errorMessage) return null;

  return (
    <div className={`toast ${errorMessage ? "error" : "ok"}`}>
      {errorMessage ?? okMessage}
    </div>
  );
}
