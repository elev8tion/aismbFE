export { contractCSS, letterhead, contractFooter, signatureBlock } from './shared';
export { generateMSA } from './msa';
export { generateSOW } from './sow';
export { generateAddendum } from './addendum';

import { ContractData } from '../types';
import { contractCSS, signatureBlock } from './shared';
import { generateMSA } from './msa';
import { generateSOW } from './sow';
import { generateAddendum } from './addendum';

export interface ContractBundle {
  msa: string;
  sow: string;
  addendum: string;
}

export function getContractBundle(data: ContractData, signatures?: Parameters<typeof signatureBlock>[0]): ContractBundle {
  return {
    msa: wrapWithCSS(generateMSA(data, signatures)),
    sow: wrapWithCSS(generateSOW(data, signatures)),
    addendum: wrapWithCSS(generateAddendum(data)),
  };
}

function wrapWithCSS(html: string): string {
  return `<!DOCTYPE html><html><head><style>${contractCSS}</style></head><body>${html}</body></html>`;
}
