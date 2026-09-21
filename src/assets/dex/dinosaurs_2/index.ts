import type { DinosaurCharacterImages } from '../dinosaurs';

export const dinosaurExpansionAssets = {
  'ichthyosaurus': {
    baby: new URL('./01_baby_ichthyosaurus.png', import.meta.url).href,
    youth: new URL('./01_youth_ichthyosaurus.png', import.meta.url).href,
    adult: new URL('./01_adult_ichthyosaurus.png', import.meta.url).href,
  },
  'plesiosaurus': {
    baby: new URL('./02_baby_plesiosaurus.png', import.meta.url).href,
    youth: new URL('./02_youth_plesiosaurus.png', import.meta.url).href,
    adult: new URL('./02_adult_plesiosaurus.png', import.meta.url).href,
  },
  'leedsichthys': {
    baby: new URL('./03_baby_leedsichthys.png', import.meta.url).href,
    youth: new URL('./03_youth_leedsichthys.png', import.meta.url).href,
    adult: new URL('./03_adult_leedsichthys.png', import.meta.url).href,
  },
  'mosasaurus': {
    baby: new URL('./04_baby_mosasaurus.png', import.meta.url).href,
    youth: new URL('./04_youth_mosasaurus.png', import.meta.url).href,
    adult: new URL('./04_adult_mosasaurus.png', import.meta.url).href,
  },
  'megalodon': {
    baby: new URL('./05_baby_megalodon.png', import.meta.url).href,
    youth: new URL('./05_youth_megalodon.png', import.meta.url).href,
    adult: new URL('./05_adult_megalodon.png', import.meta.url).href,
  },
  'tusoteuthis': {
    baby: new URL('./06_baby_tusoteuthis.png', import.meta.url).href,
    youth: new URL('./06_youth_tusoteuthis.png', import.meta.url).href,
    adult: new URL('./06_adult_tusoteuthis.png', import.meta.url).href,
  },
  'dunkleosteus': {
    baby: new URL('./07_baby_dunkleosteus.png', import.meta.url).href,
    youth: new URL('./07_youth_dunkleosteus.png', import.meta.url).href,
    adult: new URL('./07_adult_dunkleosteus.png', import.meta.url).href,
  },
  'abyssrano': {
    baby: new URL('./08_baby_abyssrano.png', import.meta.url).href,
    youth: new URL('./08_youth_abyssrano.png', import.meta.url).href,
    adult: new URL('./08_adult_abyssrano.png', import.meta.url).href,
  },
  'pachyrhinosaurus': {
    baby: new URL('./01_baby_pachyrhinosaurus.png', import.meta.url).href,
    youth: new URL('./01_youth_pachyrhinosaurus.png', import.meta.url).href,
    adult: new URL('./01_adult_pachyrhinosaurus.png', import.meta.url).href,
  },
  'troodon': {
    baby: new URL('./02_baby_troodon.png', import.meta.url).href,
    youth: new URL('./02_youth_troodon.png', import.meta.url).href,
    adult: new URL('./02_adult_troodon.png', import.meta.url).href,
  },
  'arctodus': {
    baby: new URL('./03_baby_arctodus.png', import.meta.url).href,
    youth: new URL('./03_youth_arctodus.png', import.meta.url).href,
    adult: new URL('./03_adult_arctodus.png', import.meta.url).href,
  },
  'woolly-rhino': {
    baby: new URL('./04_baby_woolly_rhino.png', import.meta.url).href,
    youth: new URL('./04_youth_woolly_rhino.png', import.meta.url).href,
    adult: new URL('./04_adult_woolly_rhino.png', import.meta.url).href,
  },
  'yutyrannus': {
    baby: new URL('./05_baby_yutyrannus.png', import.meta.url).href,
    youth: new URL('./05_youth_yutyrannus.png', import.meta.url).href,
    adult: new URL('./05_adult_yutyrannus.png', import.meta.url).href,
  },
  'smilodon': {
    baby: new URL('./06_baby_smilodon.png', import.meta.url).href,
    youth: new URL('./06_youth_smilodon.png', import.meta.url).href,
    adult: new URL('./06_adult_smilodon.png', import.meta.url).href,
  },
  'woolly-mammoth': {
    baby: new URL('./07_baby_woolly_mammoth.png', import.meta.url).href,
    youth: new URL('./07_youth_woolly_mammoth.png', import.meta.url).href,
    adult: new URL('./07_adult_woolly_mammoth.png', import.meta.url).href,
  },
  'ice-legend': {
    baby: new URL('./08_baby_ice_legend.png', import.meta.url).href,
    youth: new URL('./08_youth_ice_legend.png', import.meta.url).href,
    adult: new URL('./08_adult_ice_legend.png', import.meta.url).href,
  },
} satisfies Record<string, DinosaurCharacterImages>;

