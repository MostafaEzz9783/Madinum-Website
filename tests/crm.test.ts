import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { createInquiry } from "../src/server/crm";

const phone = `+9665${randomInt(10000000, 99999999)}`;
const inquiry = {
  name: "Integration Test", phone, email: "", type: "PROPERTY_MANAGEMENT", city: "jeddah", district: "",
  propertyType: "APARTMENT", units: "2", propertyStatus: "vacant", message: "Database integration test inquiry.", consent: "on", website: "",
};

after(async () => {
  await db.leadActivity.deleteMany({ where: { lead: { phone } } });
  await db.lead.deleteMany({ where: { phone } });
  await db.$disconnect();
});

test("invalid submissions, missing consent, and honeypot submissions never create leads", async () => {
  for (const changes of [{ phone: "wrong" }, { consent: "" }, { website: "bot" }, { city: "" }, { units: "-1" }, { type: "ADMIN" }]) {
    const result = await createInquiry({ ...inquiry, ...changes });
    assert.equal(result.status, "invalid");
  }
  assert.equal(await db.lead.count({ where: { phone } }), 0);
});

test("concurrent inquiries enforce the per-contact limit and atomically record activities", async () => {
  const results = await Promise.all(Array.from({ length: 7 }, () => createInquiry(inquiry)));
  assert.equal(results.filter(result => result.status === "success").length, 5);
  assert.equal(results.filter(result => result.status === "limited").length, 2);
  const leads = await db.lead.findMany({ where: { phone }, include: { activities: true } });
  assert.equal(leads.length, 5);
  for (const lead of leads) {
    assert.equal(lead.status, "NEW");
    assert.equal(lead.type, "PROPERTY_MANAGEMENT");
    assert.equal(lead.activities.length, 1);
    assert.equal(lead.email, null);
  }
});
