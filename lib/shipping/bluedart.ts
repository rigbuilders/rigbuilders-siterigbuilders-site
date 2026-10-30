// lib/shipping/bluedart.ts
// Blue Dart (DHL eCommerce India) API client — server-only.
//
// Auth model: call the "Token generator" API with the Consumer Key/Secret to get
// a JWT, cache it, and send it on every subsequent call (Waybill / Pickup /
// Tracking). See developer.dhl.com → "DHL eCommerce India, Blue Dart".
//
// ⚠️  The exact endpoint paths, request field names and response field names differ
// slightly by account and are only fully documented inside your DHL developer
// portal / sandbox. Every such spot is marked `VERIFY`. Run one sandbox call for
// each operation, look at the real shapes, and adjust ONLY those marked lines —
// the surrounding structure won't change.

const ENV = process.env.BLUEDART_ENV || "sandbox";
const BASE = process.env.BLUEDART_API_BASE || ""; // e.g. https://apigateway-sandbox.bluedart.com
const KEY = process.env.BLUEDART_CONSUMER_KEY || "";
const SECRET = process.env.BLUEDART_CONSUMER_SECRET || "";
const LICENSE = process.env.BLUEDART_LICENSE_KEY || "";
const LOGIN = process.env.BLUEDART_LOGIN_ID || "";
// Blue Dart's account identity is really LOGIN + LICENSE. The "Customer Code" is
// often the same value — so if BLUEDART_CUSTOMER_CODE is unset we fall back to the
// login id. That means you can (a) set the customer code explicitly, (b) set it to
// the login id, or (c) leave it blank to "try without" — all handled here.
const CUSTOMER = process.env.BLUEDART_CUSTOMER_CODE || LOGIN || "";
const ORIGIN_AREA = process.env.BLUEDART_ORIGIN_AREA || "";

export function isConfigured(): boolean {
  // Don't gate on CUSTOMER (it falls back to LOGIN above).
  return Boolean(BASE && KEY && SECRET && LICENSE && LOGIN);
}

// --- Token cache (module-level; fine for serverless warm instances) ---
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;

  // VERIFY: token endpoint path + how the key/secret are passed (header names).
  const res = await fetch(`${BASE}/in/transportation/token/v1/login`, {
    method: "GET",
    headers: {
      ClientID: KEY,          // VERIFY header name
      clientSecret: SECRET,   // VERIFY header name
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Blue Dart token failed (${res.status})`);
  const data = await res.json();
  const token = data.JWTToken || data.token || data.jwt; // VERIFY field name
  if (!token) throw new Error("Blue Dart token missing in response");

  // Tokens are typically valid ~12h — refresh a bit early.
  tokenCache = { token, exp: Date.now() + 11 * 60 * 60 * 1000 };
  return token;
}

async function call<T = any>(path: string, body: any, method: "POST" | "GET" = "POST"): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      JWTToken: token, // VERIFY auth header name (sometimes 'Authorization: Bearer')
      Accept: "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Blue Dart ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  return data as T;
}

// ---------------------------------------------------------------------
// 1. WAYBILL — generate AWB + shipping label
// ---------------------------------------------------------------------
export interface ShipperAddress {
  name: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; phone: string;
}

export interface WaybillInput {
  displayId: string;
  consignee: { name: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; phone: string; email?: string };
  weightKg: number;
  dims: { l: number; w: number; h: number; pieces: number };
  declaredValue: number;
  isCOD: boolean;
  codAmount: number;
  shipper?: ShipperAddress; // custom pickup/origin address (else the registered origin is used)
  originArea?: string;      // override BLUEDART_ORIGIN_AREA per shipment
  productCode?: string;    // from Pickup/Product master, e.g. surface vs air
  subProductCode?: string; // COD vs prepaid variant
}

export interface WaybillResult {
  awb: string;
  labelBase64?: string; // some accounts return a base64 PDF/PNG of the label
  raw: any;
}

export async function generateWaybill(input: WaybillInput): Promise<WaybillResult> {
  // VERIFY: endpoint path + the full payload schema (field names/casing).
  const payload = {
    Request: {
      Consignee: {
        ConsigneeName: input.consignee.name,
        ConsigneeAddress1: input.consignee.addressLine1,
        ConsigneeAddress2: input.consignee.addressLine2 || "",
        ConsigneePincode: input.consignee.pincode,
        ConsigneeMobile: input.consignee.phone,
        ConsigneeEmailID: input.consignee.email || "",
      },
      Shipper: {
        CustomerCode: CUSTOMER,
        OriginArea: input.originArea || ORIGIN_AREA,
        // Custom pickup/origin address (VERIFY field names against your account).
        CustomerName: input.shipper?.name || "Rig Builders",
        CustomerAddress1: input.shipper?.addressLine1 || "",
        CustomerAddress2: input.shipper?.addressLine2 || "",
        CustomerAddress3: "",
        CustomerPincode: input.shipper?.pincode || "",
        CustomerMobile: input.shipper?.phone || "",
      },
      Services: {
        ProductCode: input.productCode || "A",       // VERIFY default
        SubProductCode: input.subProductCode || "",   // VERIFY (COD vs prepaid)
        ActualWeight: input.weightKg,
        DeclaredValue: input.declaredValue,
        CollectableAmount: input.isCOD ? input.codAmount : 0,
        PieceCount: input.dims.pieces,
        Dimensions: [{ Length: input.dims.l, Breadth: input.dims.w, Height: input.dims.h, Count: input.dims.pieces }],
      },
    },
    Profile: { LoginID: LOGIN, LicenceKey: LICENSE, Api_type: "S" }, // VERIFY
  };

  const data = await call(`/in/transportation/waybill/v1/GenerateWayBill`, payload); // VERIFY path
  const awb = data?.AWBNo || data?.awbNumber || data?.WaybillNumber; // VERIFY field
  if (!awb) throw new Error(`No AWB in waybill response: ${JSON.stringify(data)}`);
  return { awb, labelBase64: data?.AWBPrintContent || data?.label, raw: data }; // VERIFY label field
}

// ---------------------------------------------------------------------
// 2. PICKUP — register / cancel
// ---------------------------------------------------------------------
export interface PickupInput {
  date: string;       // YYYY-MM-DD
  time?: string;      // ready-by, e.g. "1600"
  closeTime?: string; // office/premises closing time, e.g. "1900"
  pieces: number;
  weightKg: number;
  remarks?: string;
  productCode?: string;
}

export async function registerPickup(input: PickupInput): Promise<{ token: string; raw: any }> {
  // VERIFY: endpoint + payload
  const payload = {
    Request: {
      CustomerCode: CUSTOMER,
      PickupDate: input.date,        // VERIFY format
      PickupTime: input.time || "1600",
      ClosingTime: input.closeTime || "1900", // VERIFY field name
      ShipmentPieces: input.pieces,
      ShipmentWeight: input.weightKg,
      ProductCode: input.productCode || "A",
      AreaCode: ORIGIN_AREA,
      Remarks: input.remarks || "",  // VERIFY field name
    },
    Profile: { LoginID: LOGIN, LicenceKey: LICENSE, Api_type: "S" },
  };
  const data = await call(`/in/transportation/pickup/v1/RegisterPickup`, payload); // VERIFY path
  const token = data?.TokenNumber || data?.PickupRegistrationNumber || ""; // VERIFY field
  return { token, raw: data };
}

export async function cancelPickup(token: string): Promise<any> {
  const payload = { Request: { TokenNumber: token, CustomerCode: CUSTOMER }, Profile: { LoginID: LOGIN, LicenceKey: LICENSE, Api_type: "S" } };
  return call(`/in/transportation/pickup/v1/CancelPickup`, payload); // VERIFY path
}

// ---------------------------------------------------------------------
// 3. TRACKING — normalized
// ---------------------------------------------------------------------
export interface TrackScan { status: string; date?: string; location?: string }
export interface TrackResult { awb: string; latest: string; scans: TrackScan[]; raw: any }

export async function track(awb: string): Promise<TrackResult> {
  // VERIFY: tracking endpoint (often GET with query params) + response shape.
  const data = await call(`/in/transportation/tracking/v1/shipment?awb=${encodeURIComponent(awb)}`, null, "GET"); // VERIFY path
  const scans: TrackScan[] = (data?.Shipment?.Scans || data?.scans || []).map((s: any) => ({
    status: s?.ScanType || s?.Scan || s?.status || "",   // VERIFY
    date: s?.ScanDate || s?.date,
    location: s?.ScannedLocation || s?.location,
  }));
  const latest = scans[0]?.status || data?.Status || ""; // VERIFY (is scans[0] newest?)
  return { awb, latest, scans, raw: data };
}

// ---------------------------------------------------------------------
// 4. RATE / CHARGES + TRANSIT — estimate the cost before booking
// ---------------------------------------------------------------------
export interface RateInput {
  originPincode: string;
  destPincode: string;
  weightKg: number;
  pieces: number;
  declaredValue: number;
  isCOD: boolean;
  codAmount: number;
  dims?: { l: number; w: number; h: number };
  productCode?: string;
  subProductCode?: string;
}

export interface RateResult {
  total: number;        // estimated charge (INR), 0 if the API didn't return one
  currency: string;
  transit?: string;     // transit time / expected delivery, if returned
  breakdown?: any;      // raw charge components if present
  raw: any;
}

// NOTE: Blue Dart exposes rate/transit via a "finder" API whose exact path,
// payload and response differ by account/plan — every spot is `VERIFY`. Some
// accounts don't expose live pricing at all (they price off a contracted rate
// card); in that case this returns total: 0 with the raw response for you to
// inspect. Confirm the endpoint with your Blue Dart portal before relying on it.
export async function getRate(input: RateInput): Promise<RateResult> {
  const payload = {
    Request: {
      OriginPinCode: input.originPincode,       // VERIFY field names
      DestinationPinCode: input.destPincode,
      ActualWeight: input.weightKg,
      PieceCount: input.pieces,
      DeclaredValue: input.declaredValue,
      ProductCode: input.productCode || "A",
      SubProductCode: input.subProductCode || (input.isCOD ? "C" : ""),
      CollectableAmount: input.isCOD ? input.codAmount : 0,
      ...(input.dims ? { Dimensions: [{ Length: input.dims.l, Breadth: input.dims.w, Height: input.dims.h, Count: input.pieces }] } : {}),
    },
    Profile: { LoginID: LOGIN, LicenceKey: LICENSE, Api_type: "S" },
  };

  // VERIFY: endpoint path. Common finder paths look like
  // /in/transportation/finder/v1/... — adjust to your account's documented one.
  const data = await call(`/in/transportation/finder/v1/GetChargesAndTransit`, payload);

  const total = Number(
    data?.TotalAmount ?? data?.TotalCharge ?? data?.NetCharge ?? data?.Charge ?? data?.total ?? 0
  );
  const transit =
    data?.ExpectedDeliveryDate || data?.TransitTime || data?.TransitDays || data?.transit || undefined;

  return {
    total: Number.isFinite(total) ? total : 0,
    currency: "INR",
    transit,
    breakdown: data?.Charges || data?.ChargeBreakup || null,
    raw: data,
  };
}

// ---------------------------------------------------------------------
// 5. DIAGNOSE — safe sandbox connectivity check (no side effects)
// ---------------------------------------------------------------------
// Hits ONLY the token endpoint and (optionally) the read-only rate finder,
// capturing the raw HTTP status + response body WITHOUT throwing, so we can
// read Blue Dart's real field names and fix any `VERIFY` spot. Never generates
// a waybill or books a pickup. Secrets are never echoed back.
export interface DiagnoseInput {
  rate?: { originPincode: string; destPincode: string; weightKg: number; pieces: number; declaredValue: number };
}
export interface DiagnoseResult {
  config: { base: string; env: string; hasKey: boolean; hasSecret: boolean; login: string; customer: string; originArea: string };
  token: { ok: boolean; status: number | null; tokenFieldFound: string | null; raw: any; error?: string };
  rate?: { ok: boolean; status: number | null; raw: any; error?: string };
}

export async function diagnose(input: DiagnoseInput = {}): Promise<DiagnoseResult> {
  const out: DiagnoseResult = {
    config: {
      base: BASE, env: ENV, hasKey: !!KEY, hasSecret: !!SECRET,
      login: LOGIN, customer: CUSTOMER, originArea: ORIGIN_AREA,
    },
    token: { ok: false, status: null, tokenFieldFound: null, raw: null },
  };

  // --- Step 1: token ---
  let token = "";
  try {
    const res = await fetch(`${BASE}/in/transportation/token/v1/login`, {
      method: "GET",
      headers: { ClientID: KEY, clientSecret: SECRET, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    const found = data?.JWTToken ? "JWTToken" : data?.token ? "token" : data?.jwt ? "jwt" : null;
    token = (found ? (data as any)[found] : "") || "";
    out.token = {
      ok: res.ok && !!token,
      status: res.status,
      tokenFieldFound: found,
      // Redact the actual token; show only its keys + a length so we can confirm the field.
      raw: redactToken(data),
    };
  } catch (e: any) {
    out.token.error = e?.message || "token request failed";
    return out;
  }

  if (!token || !input.rate) return out;

  // --- Step 2: rate finder (read-only) ---
  try {
    const payload = {
      Request: {
        OriginPinCode: input.rate.originPincode,
        DestinationPinCode: input.rate.destPincode,
        ActualWeight: input.rate.weightKg,
        PieceCount: input.rate.pieces,
        DeclaredValue: input.rate.declaredValue,
        ProductCode: "A",
        SubProductCode: "",
        CollectableAmount: 0,
      },
      Profile: { LoginID: LOGIN, LicenceKey: LICENSE, Api_type: "S" },
    };
    const res = await fetch(`${BASE}/in/transportation/finder/v1/GetChargesAndTransit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", JWTToken: token, Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    out.rate = { ok: res.ok, status: res.status, raw: data };
  } catch (e: any) {
    out.rate = { ok: false, status: null, raw: null, error: e?.message || "rate request failed" };
  }

  return out;
}

// Replace any token-looking value with "<redacted len=N>" so raw shapes are safe to show.
function redactToken(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (/token|jwt/i.test(k) && typeof v === "string") clone[k] = `<redacted len=${v.length}>`;
    else if (v && typeof v === "object") clone[k] = redactToken(v);
    else clone[k] = v;
  }
  return clone;
}
