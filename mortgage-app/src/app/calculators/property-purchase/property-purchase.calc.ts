const FMA_RATE = 0.03;
const NOTARY_RATE = 0.01;
const VAT_RATE = 0.24;
const LAND_REGISTRY_RATE = 0.00475;
const AGENT_RATE = 0.02;
const LAWYER_RATE = 0.005;
const OTHER_FIXED = 500;

const FH_BASE_SINGLE = 200_000;
const FH_BASE_MARRIED = 250_000;
const FH_PER_CHILD = 25_000;

export interface CostItem {
  label: string;
  amount: number;
  note?: string;
  isOptional: boolean;
  isExempt: boolean;
}

export interface PropertyPurchaseParams {
  purchasePrice?: number;
  aaotValue?: number;
  isFirstHome?: boolean;
  isMarried?: boolean;
  children?: number;
  includeAgent?: boolean;
  includeLawyer?: boolean;
}

export interface PropertyPurchaseResult {
  purchasePrice: number;
  taxBase: number;
  fmaExemption: number;
  fmaTaxable: number;
  fma: number;
  notary: number;
  landRegistry: number;
  agentFee: number;
  lawyerFee: number;
  otherFixed: number;
  totalExtraCosts: number;
  totalAcquisitionCost: number;
  extraCostsPct: number;
  items: CostItem[];
  fhThreshold: number;
  firstHomeFullExempt: boolean;
}

export function calculatePropertyPurchase(params: PropertyPurchaseParams): PropertyPurchaseResult {
  const price = Math.max(0, +(params.purchasePrice || 0));
  const aaot = Math.max(0, +(params.aaotValue || price));
  const taxBase = Math.max(price, aaot);
  const isFirst = !!params.isFirstHome;
  const married = !!params.isMarried;
  const children = Math.max(0, +(params.children || 0));
  const inclAgent = !!params.includeAgent;
  const inclLawyer = !!params.includeLawyer;

  const fhBase = married ? FH_BASE_MARRIED : FH_BASE_SINGLE;
  const fhThreshold = isFirst ? fhBase + children * FH_PER_CHILD : 0;
  const fmaExemption = isFirst ? Math.min(taxBase, fhThreshold) : 0;
  const fmaTaxable = Math.max(0, taxBase - fmaExemption);
  const fma = +(fmaTaxable * FMA_RATE).toFixed(2);

  const notary = +(price * NOTARY_RATE * (1 + VAT_RATE)).toFixed(2);
  const landRegistry = +(price * LAND_REGISTRY_RATE).toFixed(2);
  const agentFee = inclAgent ? +(price * AGENT_RATE * (1 + VAT_RATE)).toFixed(2) : 0;
  const lawyerFee = inclLawyer ? +(price * LAWYER_RATE).toFixed(2) : 0;

  const totalExtraCosts = +(
    fma +
    notary +
    landRegistry +
    agentFee +
    lawyerFee +
    OTHER_FIXED
  ).toFixed(2);
  const totalAcquisitionCost = +(price + totalExtraCosts).toFixed(2);
  const extraCostsPct = price > 0 ? +((totalExtraCosts / price) * 100).toFixed(1) : 0;
  const firstHomeFullExempt = isFirst && fmaExemption >= taxBase;

  const items: CostItem[] = [
    {
      label: 'Φόρος Μεταβίβασης Ακινήτου (ΦΜΑ) 3%',
      amount: fma,
      note:
        isFirst && fmaExemption > 0
          ? `Απαλλαγή πρώτης κατοικίας: ${fmaExemption.toLocaleString('el-GR')}€`
          : undefined,
      isOptional: false,
      isExempt: firstHomeFullExempt,
    },
    {
      label: 'Συμβολαιογραφικά (~1% + ΦΠΑ 24%)',
      amount: notary,
      isOptional: false,
      isExempt: false,
    },
    {
      label: 'Κτηματολόγιο (0,475%)',
      amount: landRegistry,
      isOptional: false,
      isExempt: false,
    },
    ...(inclAgent
      ? [
          {
            label: 'Αμοιβή Μεσίτη (2% + ΦΠΑ 24%)',
            amount: agentFee,
            isOptional: true,
            isExempt: false,
          },
        ]
      : []),
    ...(inclLawyer
      ? [
          {
            label: 'Αμοιβή Δικηγόρου (~0,5%)',
            amount: lawyerFee,
            isOptional: true,
            isExempt: false,
          },
        ]
      : []),
    {
      label: 'Λοιπές Δαπάνες (ενεργειακό, τεχνικός)',
      amount: OTHER_FIXED,
      isOptional: false,
      isExempt: false,
    },
  ];

  return {
    purchasePrice: price,
    taxBase,
    fmaExemption,
    fmaTaxable,
    fma,
    notary,
    landRegistry,
    agentFee,
    lawyerFee,
    otherFixed: OTHER_FIXED,
    totalExtraCosts,
    totalAcquisitionCost,
    extraCostsPct,
    items,
    fhThreshold,
    firstHomeFullExempt,
  };
}
