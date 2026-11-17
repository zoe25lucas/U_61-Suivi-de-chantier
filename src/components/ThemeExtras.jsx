import './ThemeExtras.css';

// Tableau et encadré d'analyse d'une section de thème (site et PDF)
export default function ThemeExtras({ sec, print = false }) {
  const table = sec.table;
  if (!table && !sec.note) return null;
  return (
    <div className={`tx ${print ? 'tx-print' : ''}`}>
      {table && table.rows?.length > 0 && (
        <table className="tx-table">
          {table.head && (
            <thead><tr>{table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          )}
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className={i === table.rows.length - 1 && /total/i.test(r[0]) ? 'tx-total' : ''}>
                {r.map((c, j) => <td key={j}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sec.note && <div className="tx-note">{sec.note}</div>}
    </div>
  );
}
