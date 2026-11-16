import { Heart, BookOpen, Briefcase, Calendar, CheckCircle } from 'lucide-react';
import { usePeriodesAlternance } from '../lib/usePeriodesAlternance';
import { REMERCIEMENTS, INTRODUCTION, MISSION, NOTE_EXAMENS } from '../data/avantPropos';
import CalendrierAlternance from '../components/CalendrierAlternance';
import './AvantPropos.css';

export default function AvantPropos() {
  const periods = usePeriodesAlternance();

  return (
    <div className="profil-wrap avant-propos">
      <div className="profil-header">
        <div className="profil-header-info">
          <div className="profil-eyebrow">RAPPORT D'ACTIVITÉS · ÉPREUVE U61</div>
          <h1 className="profil-name">Avant-propos</h1>
          <div className="profil-sub">Remerciements, introduction, ma mission et mon calendrier d'alternance</div>
        </div>
      </div>

      <div className="profil-body">
        <div className="profil-col-left">
          <div className="profil-card">
            <h3 className="profil-card-title"><Heart size={15} /> Remerciements</h3>
            {REMERCIEMENTS.map((p, i) => <p key={i} className="ap-text">{p}</p>)}
          </div>

          <div className="profil-card">
            <h3 className="profil-card-title"><Briefcase size={15} /> Ma mission</h3>
            <div className="ap-poste">{MISSION.poste}</div>
            <div className="ap-poste-reel">{MISSION.posteReel}</div>
            <div className="ap-infos">
              {MISSION.infos.map(info => (
                <div key={info.label} className="ap-info"><span>{info.label}</span><strong>{info.value}</strong></div>
              ))}
            </div>
            {MISSION.groupes.map(g => (
              <div key={g.titre} className="ap-groupe">
                <div className="ap-groupe-head">
                  <span className="ap-groupe-titre">{g.titre}</span>
                  <span className="ap-comps">{g.competences.map(c => <span key={c} className="ap-comp">{c}</span>)}</span>
                </div>
                <ul>{g.items.map(it => <li key={it}><CheckCircle size={12} /> {it}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        <div className="profil-col-right">
          <div className="profil-card">
            <h3 className="profil-card-title"><BookOpen size={15} /> Introduction</h3>
            {INTRODUCTION.map((p, i) => <p key={i} className="ap-text">{p}</p>)}
          </div>
        </div>
      </div>

      <div className="profil-card ap-calendrier">
        <h3 className="profil-card-title"><Calendar size={15} /> Calendrier d'alternance</h3>
        <CalendrierAlternance periods={periods} />
        <p className="ap-note">{NOTE_EXAMENS}</p>
      </div>
    </div>
  );
}
