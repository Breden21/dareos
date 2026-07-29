import type { Account } from "./types";

// NOTE: These are demo credentials for the prototype only. Real auth
// (proper accounts, password reset, roles/permissions) is a backend concern
// for later — see README.

export const ACCOUNTS: Account[] = [
  { email: "ceo@mutasa.rdc.gov.zw", password: "ceo2026", role: "ceo", name: "B. Nyatoro", roleLabel: "Chief Executive (Acting)" },
  { email: "collector@mutasa.rdc.gov.zw", password: "collect2026", role: "collector", name: "E. Mavhuto", roleLabel: "Revenue Collector", collectionPointId: "CP-01" },
  { email: "ward7@mutasa.rdc.gov.zw", password: "ward2026", role: "ward_officer", name: "V. Mangwiro", roleLabel: "VIDCO Secretary, Ward 7", ward: "Ward 7" },
  { email: "driver@mutasa.rdc.gov.zw", password: "drive2026", role: "driver", name: "S. Manyika", roleLabel: "Fleet Driver", vehicleId: "MUT-GR-01" },
  { email: "records@mutasa.rdc.gov.zw", password: "records2026", role: "records_clerk", name: "P. Gumbo", roleLabel: "Records Clerk" },
];
