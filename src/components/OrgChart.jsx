import './OrgChart.css';

// Organigramme visuel : la direction en haut, les services en grille,
// puis l'équipe de l'alternante (la branche qui la contient) mise en valeur.

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const displayName = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const first = parts[0].charAt(0) + parts[0].slice(1).toLowerCase();
  return `${first} ${parts.slice(1).join(' ').toUpperCase()}`;
};
const containsUser = (node) => !!node && (node.isUser || (node.children || []).some(containsUser));

function Card({ node, variant = '', sub }) {
  return (
    <div className={`oc-card ${variant} ${node.isUser ? 'oc-user' : ''}`}>
      <span className="oc-avatar">{initials(node.name)}</span>
      <span className="oc-text">
        <span className="oc-name">{displayName(node.name)}</span>
        <span className="oc-role">{node.role}</span>
        {sub && <span className="oc-sub">{sub}</span>}
      </span>
      {node.isUser && <span className="oc-badge">Moi</span>}
    </div>
  );
}

// Les sous-équipes d'un membre (ex. un alternant rattaché à une conductrice) sont résumées sous sa carte
const subLine = (node) => (node.children?.length ? `Équipe : ${node.children.map(c => displayName(c.name)).join(', ')}` : null);

export default function OrgChart({ data, compact = false }) {
  if (!data) return null;
  const children = data.children || [];
  const userBranch = children.find(containsUser);
  const others = children.filter(c => c !== userBranch);

  return (
    <div className={`oc ${compact ? 'oc-compact' : ''}`}>
      <div className="oc-root-row"><Card node={data} variant="oc-root" /></div>
      <div className="oc-stem" />

      <div className="oc-group">
        <div className="oc-group-title">Direction de l'agence et services</div>
        <div className="oc-grid">
          {others.map((c, i) => <Card key={i} node={c} sub={subLine(c)} />)}
        </div>
      </div>

      {userBranch && (
        <div className="oc-group oc-team">
          <div className="oc-group-title">Mon secteur</div>
          <div className="oc-root-row"><Card node={userBranch} variant="oc-lead" /></div>
          <div className="oc-stem small" />
          <div className="oc-grid">
            {(userBranch.children || []).map((c, i) => <Card key={i} node={c} sub={c.isUser ? null : subLine(c)} />)}
          </div>
        </div>
      )}
    </div>
  );
}
