import type { AdventureStageConfig } from '../config/adventureStages';

export function AdventureStageIntro({ config, onStart }: { config: AdventureStageConfig; onStart: () => void }) {
  return (
    <div className={`adventure-stage-intro adventure-stage-intro--${config.theme}`} role="dialog" aria-modal="true" aria-labelledby={`${config.theme}-stage-title`}>
      <section className="adventure-stage-intro__panel">
        <strong className="adventure-stage-intro__number">STAGE {config.stage}</strong>
        <h2 id={`${config.theme}-stage-title`}>{config.title}</h2>
        <p>{config.instruction}</p>
        <button type="button" onClick={onStart}>시작</button>
      </section>
    </div>
  );
}
