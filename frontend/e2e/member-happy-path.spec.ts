import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";

const apiBaseURL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8010";
const dexPayWebhookSecret = "e2e-dexpay-webhook-secret";

test("parcours membre: adhesion payee, PIN, dashboard, cotisations et carte", async ({ page, request }) => {
  const member = await registerAndActivateMember(request);

  await page.goto("/login");
  await page.getByPlaceholder(/TBH/i).fill(member.matricule);
  await page.getByPlaceholder(/6 chiffres/i).fill(member.pin);
  await page.getByRole("button", { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /tableau de bord membre|bienvenue/i })).toBeVisible();

  await page.goto("/cotisations");
  await expect(page.getByRole("heading", { name: /mes cotisations/i })).toBeVisible();

  await page.goto("/carte");
  await expect(page.getByRole("heading", { name: /carte virtuelle/i })).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
});

test("recette membre: paiement echoue, QR public et compte bloque", async ({ page, request }) => {
  const failed = await registerAdhesionApplication(request);
  const failedPayment = await initiateAdhesionPayment(request, failed);
  await confirmDexPayCheckout(request, failedPayment.reference, "failed");
  const failedStatus = await request.get(`${apiBaseURL}/api/adhesion/${failed.applicationPublicId}/status`);
  expect(failedStatus.ok()).toBeTruthy();
  const failedBody = await failedStatus.json();
  expect(failedBody.application.statut).toBe("failed");
  expect(failedBody.member).toBeNull();

  const member = await registerAndActivateMember(request);
  const memberToken = await loginAsMember(request, member);
  const cardResponse = await request.get(`${apiBaseURL}/api/member-card`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  expect(cardResponse.ok()).toBeTruthy();
  const cardBody = await cardResponse.json();
  expect(cardBody.card.verification_url).toContain("/api/member-card/verify/");

  const verification = await request.get(cardBody.card.verification_url);
  expect(verification.ok()).toBeTruthy();
  const verificationBody = await verification.json();
  expect(verificationBody.valid).toBe(true);
  expect(verificationBody.card.matricule).toBe(member.matricule);

  const adminToken = await loginAsAdmin(request);
  const block = await request.post(`${apiBaseURL}/api/admin/block-user`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      user_id: member.id,
      description: "Blocage recette E2E",
      confirmation_phrase: "BLOQUER",
    },
  });
  expect(block.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByPlaceholder(/TBH/i).fill(member.matricule);
  await page.getByPlaceholder(/6 chiffres/i).fill(member.pin);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/account-blocked$/);

  const invalidVerification = await request.get(cardBody.card.verification_url);
  expect(invalidVerification.ok()).toBeTruthy();
  const invalidBody = await invalidVerification.json();
  expect(invalidBody.valid).toBe(false);
  expect(invalidBody.reason).toBe("account_blocked");
});

async function registerAndActivateMember(request: APIRequestContext) {
  const member = await registerAdhesionApplication(request);
  const payment = await initiateAdhesionPayment(request, member);
  await confirmDexPayCheckout(request, payment.reference, "success");

  const status = await request.get(`${apiBaseURL}/api/adhesion/${member.applicationPublicId}/status`);
  expect(status.ok()).toBeTruthy();
  const statusBody = await status.json();
  member.id = statusBody.member.id;
  member.matricule = statusBody.member.matricule;

  return member;
}

async function registerAdhesionApplication(request: APIRequestContext) {
  const member = makeMemberData();

  const start = await request.post(`${apiBaseURL}/api/adhesion/start`, {
    data: {
      civilite: "M",
      prenom: member.prenom,
      nom: member.nom,
      date_naissance: "1990-01-15",
      telephone: member.telephone,
      email: member.email,
      pays_residence: "Senegal",
      region: "Dakar",
      departement: "Dakar",
      commune: "Medina",
      numero_cni: member.numeroCni,
      pin: member.pin,
      pin_confirmation: member.pin,
      conditions_acceptees: true,
    },
  });
  expect(start.ok()).toBeTruthy();
  const startBody = await start.json();
  member.applicationPublicId = startBody.application.public_id;

  return member;
}

async function initiateAdhesionPayment(request: APIRequestContext, member: E2EMember) {
  const payment = await request.post(`${apiBaseURL}/api/adhesion/${member.applicationPublicId}/payment`, {
    data: {
      canal_paiement: "wave",
      idempotency_key: `e2e-adhesion-${member.telephone}`,
    },
  });
  expect(payment.ok()).toBeTruthy();
  const paymentBody = await payment.json();

  return {
    reference: paymentBody.application.payment_reference as string,
  };
}

async function confirmDexPayCheckout(request: APIRequestContext, reference: string, status: "success" | "failed") {
  const payload = {
    event: status === "success" ? "checkout.completed" : "checkout.failed",
    data: {
      reference,
      status,
    },
  };
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", dexPayWebhookSecret).update(rawBody).digest("hex");
  const response = await request.post(`${apiBaseURL}/api/webhook/dexpay`, {
    headers: {
      "X-Dexchange-Signature": signature,
      "Content-Type": "application/json",
    },
    data: payload,
  });
  expect(response.ok()).toBeTruthy();
}

async function loginAsMember(request: APIRequestContext, member: E2EMember) {
  const response = await request.post(`${apiBaseURL}/api/login`, {
    data: {
      identifier: member.matricule,
      pin: member.pin,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.token as string;
}

async function loginAsAdmin(request: APIRequestContext) {
  const response = await request.post(`${apiBaseURL}/api/login`, {
    data: {
      identifier: "test@example.com",
      password: "password",
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.token as string;
}

function makeMemberData(): E2EMember {
  const suffix = `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
  const cniSuffix = suffix.padStart(12, "0").slice(-12);

  return {
    prenom: "E2E",
    nom: "Membre",
    email: `membre.e2e.${suffix}@example.com`,
    telephone: `77${suffix.slice(-7)}`,
    numeroCni: `8${cniSuffix}`,
    pin: "482951",
    id: 0,
    applicationPublicId: "",
    matricule: "",
  };
}

type E2EMember = {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  numeroCni: string;
  pin: string;
  applicationPublicId: string;
  matricule: string;
};
