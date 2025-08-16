export type TPTrail =
  | 'none'
  | 'sparkles'
  | 'rainbow'
  | 'bubbles'
  | 'confetti'
  | 'glow';

export type PracticeSettings = {
  tpSkin: string;
  toiletSpeed: number;
  gravity: number;
  tpTrail: TPTrail;
};

export const defaultPracticeSettings: PracticeSettings = {
  tpSkin: 'tp.png',
  toiletSpeed: 5,
  gravity: 5,
  tpTrail: 'none',
};

