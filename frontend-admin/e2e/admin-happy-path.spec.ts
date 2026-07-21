import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const apiBaseURL = process.env.E2E_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8020";
const dexPayWebhookSecret = "e2e-dexpay-webhook-secret";

test("parcours admin: membres, relance paiement et export CSV", async ({ page, request }) => {
  const activeMember = await registerAndActivateMember(request, "Bloquer");
  const incidentMember = await registerAndActivateMember(request, "Relance");
  const incidentReference = await createPendingCotisation(request, incidentMember);

  await loginAdminInUi(page);

  await blockAndUnblockMember(page, activeMember);
  await remindPendingPayment(page, incidentReference);
  await exportPaymentsCsv(page);
});

async function loginAdminInUi(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email ou t.l.phone admin/i).fill("test@example.com");
  await page.getByPlaceholder(/mot de passe/i).fill("password");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /dashboard admin/i })).toBeVisible();
}

async function blockAndUnblockMember(page: Page, member: E2EMember) {
  await openMemberSearch(page, member.telephone);
  const row = memberRow(page, member);
  await expect(row).toBeVisible();
  await clickMemberAction(row, /^bloquer$/i);
  const blockDialog = page.getByRole("dialog");
  await expect(blockDialog.getByRole("heading", { name: /bloquer ce membre/i })).toBeVisible();
  await blockDialog.locator("input").fill("BLOQUER");
  await activateButton(blockDialog.getByRole("button", { name: /^bloquer$/i }));
  await expect(memberStatusCell(page, member).getByText(/^bloque$/i)).toBeVisible();

  await clickMemberAction(memberRow(page, member), /^debloquer$/i);
  const unblockDialog = page.getByRole("dialog");
  await expect(unblockDialog.getByRole("heading", { name: /debloquer ce membre/i })).toBeVisible();
  await activateButton(unblockDialog.getByRole("button", { name: /^debloquer$/i }));
  await expect(memberStatusCell(page, member).getByText(/^actif$/i)).toBeVisible();
}

async function remindPendingPayment(page: Page, incidentReference: string) {
  await page.goto("/finance");
  await expect(page.getByRole("heading", { name: /^finance$/i })).toBeVisible();
  await expect(page.getByText(incidentReference)).toBeVisible();
  const incidentCard = page.getByText(incidentReference).locator("xpath=ancestor::div[contains(@class, 'lg:grid-cols')][1]");
  await activateButton(incidentCard.getByRole("button", { name: /^relancer$/i }));
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /relancer ce paiement/i })).toBeVisible();
  await activateButton(dialog.getByRole("button", { name: /^relancer$/i }));
  await expect(dialog).toBeHidden();
}

async function exportPaymentsCsv(page: Page) {
  await page.goto("/finance");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /exporter csv/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/paiements_export_.*\.csv$/);
}

async function openMemberSearch(page: Page, telephone: string) {
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: /vue globale des membres/i })).toBeVisible();
  await page.getByPlaceholder(/rechercher nom/i).fill(telephone);
  await page.getByRole("button", { name: /rechercher/i }).click();
}

function memberRow(page: Page, member: E2EMember) {
  return page.getByRole("row").filter({ hasText: member.telephone });
}

function memberStatusCell(page: Page, member: E2EMember) {
  return memberRow(page, member).locator("td").nth(2);
}

async function clickMemberAction(row: Locator, name: RegExp) {
  const button = row.getByRole("button", { name });
  await button.evaluate((element) => {
    const scroller = element.closest(".overflow-x-auto");
    if (scroller instanceof HTMLElement) {
      scroller.scrollLeft = scroller.scrollWidth;
    }
  });
  await button.scrollIntoViewIfNeeded();
  try {
    await activateButton(button);
  } catch {
    await button.dispatchEvent("click");
  }
}

async function activateButton(button: Locator) {
  try {
    await button.click({ timeout: 1_500 });
  } catch {
    await button.focus();
    await button.press("Enter");
  }
}

async function registerAndActivateMember(request: APIRequestContext, label: string) {
  const member = await registerMember(request, label);
  const payment = await request.post(`${apiBaseURL}/api/adhesion/${member.applicationPublicId}/payment`, {
    data: {
      canal_paiement: "wave",
      idempotency_key: `adhesion-${member.telephone}`,
    },
  });
  expect(payment.ok()).toBeTruthy();
  const paymentBody = await payment.json();
  await confirmDexPayCheckout(request, paymentBody.application.payment_reference, "success");
  const status = await request.get(`${apiBaseURL}/api/adhesion/${member.applicationPublicId}/status`);
  expect(status.ok()).toBeTruthy();
  const statusBody = await status.json();
  member.id = statusBody.member.id;
  member.matricule = statusBody.member.matricule;
  return member;
}

async function createPendingCotisation(request: APIRequestContext, member: E2EMember) {
  const memberToken = await loginAsMember(request, member);
  const response = await request.post(`${apiBaseURL}/api/paiement`, {
    headers: {
      Authorization: `Bearer ${memberToken}`,
    },
    data: {
      telephone: member.telephone,
      methode_paiement: "dexpay",
      canal_paiement: "orange_money",
      type: "cotisation",
      montant: 5000,
      idempotency_key: `cotisation-${member.telephone}`,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.paiement.reference as string;
}

async function registerMember(request: APIRequestContext, label: string): Promise<E2EMember> {
  const suffix = `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
  const telephone = `77${suffix.slice(-7)}`;
  const cni = `8${suffix.padStart(12, "0").slice(-12)}`;
  const member = {
    id: 0,
    prenom: `E2E${label}`,
    nom: "Admin",
    email: `admin-e2e-${label.toLowerCase()}-${suffix}@example.com`,
    telephone,
    numeroCni: cni,
    pin: "482951",
    applicationPublicId: "",
    matricule: "",
  };

  const registerResponse = await request.post(`${apiBaseURL}/api/adhesion/start`, {
    data: {
      civilite: "M",
      nom: member.nom,
      prenom: member.prenom,
      date_naissance: "1990-01-15",
      email: member.email,
      telephone: member.telephone,
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
  expect(registerResponse.ok()).toBeTruthy();
  const registerBody = await registerResponse.json();
  member.applicationPublicId = registerBody.application.public_id;
  return member;
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

async function confirmDexPayCheckout(request: APIRequestContext, reference: string, status: "success" | "failed") {
  const payload = {
    event: status === "success" ? "checkout.completed" : "checkout.failed",
    data: {
      reference,
      status,
    },
  };
  const rawPayload = JSON.stringify(payload);
  const response = await request.post(`${apiBaseURL}/api/webhook/dexpay`, {
    headers: {
      "X-Dexchange-Signature": createHmac("sha256", dexPayWebhookSecret).update(rawPayload).digest("hex"),
    },
    data: payload,
  });
  expect(response.ok()).toBeTruthy();
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
