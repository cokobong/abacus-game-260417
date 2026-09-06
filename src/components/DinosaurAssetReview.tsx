import { useEffect, useMemo, useState } from 'react';
import './DinosaurAssetReview.css';

type AssetMap = Record<string, string>;
type BackgroundMode = 'checker' | 'light' | 'dark';

const originalAssets = import.meta.glob('../assets/dex/dino_upgrade/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as AssetMap;

const transparentAssets = import.meta.glob('../assets/dex/dinosaurs_1/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as AssetMap;

const speciesLabels: Record<string, string> = {
  crystalo: '크리스탈로',
  dilophosaurus: '딜로포사우루스',
  dimetrodon: '디메트로돈',
  distortus_rex: '디스토르투스 렉스',
  indominus_rex: '인도미누스 렉스',
  leafcera: '리프케라',
  pteranodon: '프테라노돈',
  starano: '스타라노',
  volcanodon: '볼케이노돈',
};

const stageOrder = ['baby', 'youth', 'adult'] as const;
const stageLabels = { baby: '아기', youth: '청소년', adult: '성체' };

function baseName(path: string) {
  return path.split('/').at(-1)?.replace('-removebg-preview', '') ?? path;
}

function parseAsset(path: string) {
  const name = baseName(path);
  const match = name.match(/^dino_(.+?)(?:_(youth|adult))?_character\.png$/);
  if (!match) return null;
  return { species: match[1]!, stage: (match[2] ?? 'baby') as (typeof stageOrder)[number], name };
}

interface Metrics {
  width: number;
  height: number;
  transparentPercent: number;
  partialPercent: number;
}

function AssetCard({ title, src, background }: { title: string; src: string; background: BackgroundMode }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let partial = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] === 0) transparent += 1;
        else if (pixels[index] < 255) partial += 1;
      }
      const total = canvas.width * canvas.height;
      setMetrics({
        width: canvas.width,
        height: canvas.height,
        transparentPercent: (transparent / total) * 100,
        partialPercent: (partial / total) * 100,
      });
    };
    image.src = src;
  }, [src]);

  const hasTransparency = metrics && metrics.transparentPercent + metrics.partialPercent > 0.01;

  return (
    <article className="asset-review-card">
      <header>
        <strong>{title}</strong>
        {metrics && (
          <span className={hasTransparency ? 'asset-review-badge is-clear' : 'asset-review-badge is-opaque'}>
            {hasTransparency ? '투명 영역 있음' : '불투명 배경'}
          </span>
        )}
      </header>
      <div className={`asset-review-canvas is-${background}`}>
        <img src={src} alt={title} />
      </div>
      <footer>
        {metrics
          ? `${metrics.width}×${metrics.height} · 완전 투명 ${metrics.transparentPercent.toFixed(1)}% · 반투명 ${metrics.partialPercent.toFixed(1)}%`
          : '이미지 분석 중…'}
      </footer>
    </article>
  );
}

export function DinosaurAssetReview() {
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [background, setBackground] = useState<BackgroundMode>('checker');

  const pairs = useMemo(() => {
    const transparentByName = new Map(
      Object.entries(transparentAssets).map(([path, src]) => [baseName(path), src]),
    );
    return Object.entries(originalAssets)
      .map(([path, original]) => {
        const parsed = parseAsset(path);
        if (!parsed) return null;
        return { ...parsed, original, transparent: transparentByName.get(parsed.name) };
      })
      .filter((pair): pair is NonNullable<typeof pair> => Boolean(pair))
      .sort((a, b) => {
        const speciesDifference = a.species.localeCompare(b.species);
        return speciesDifference || stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
      });
  }, []);

  const species: string[] = Array.from(new Set(pairs.map((pair) => String(pair.species))));
  const visiblePairs = selectedSpecies === 'all'
    ? pairs
    : pairs.filter((pair) => pair.species === selectedSpecies);
  const missingPairCount = pairs.filter((pair) => !pair.transparent).length;

  return (
    <main className="asset-review-page">
      <section className="asset-review-heading">
        <div>
          <p className="asset-review-eyebrow">개발용 · 도감 잠금과 무관</p>
          <h1>공룡 에셋 원본/투명본 비교</h1>
          <p>9종 27세트의 해상도, 배경 투명도와 가장자리 품질을 직접 비교합니다.</p>
        </div>
        <div className="asset-review-summary">
          <strong>{pairs.length - missingPairCount}/{pairs.length}</strong>
          <span>{missingPairCount ? `매칭 누락 ${missingPairCount}개` : '모든 파일 1:1 매칭'}</span>
        </div>
      </section>

      <nav className="asset-review-toolbar" aria-label="에셋 필터">
        <label>
          공룡
          <select value={selectedSpecies} onChange={(event) => setSelectedSpecies(event.target.value)}>
            <option value="all">전체 9종</option>
            {species.map((key) => <option key={key} value={key}>{speciesLabels[key] ?? key}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>검사 배경</legend>
          {(['checker', 'light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={background === mode ? 'is-active' : ''}
              onClick={() => setBackground(mode)}
            >
              {{ checker: '체크무늬', light: '밝게', dark: '어둡게' }[mode]}
            </button>
          ))}
        </fieldset>
      </nav>

      <section className="asset-review-list">
        {visiblePairs.map((pair) => (
          <div className="asset-review-pair" key={`${pair.species}-${pair.stage}`}>
            <h2>{speciesLabels[pair.species] ?? pair.species} <span>{stageLabels[pair.stage]}</span></h2>
            <div className="asset-review-grid">
              <AssetCard title="원본 (dino_upgrade)" src={pair.original} background={background} />
              {pair.transparent
                ? <AssetCard title="투명 저해상도본 (dinosaurs_1)" src={pair.transparent} background={background} />
                : <div className="asset-review-missing">대응 투명본이 없습니다.</div>}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
