import assert from "node:assert/strict";
import { test } from "node:test";
import { localeSchema, switchLocalePath } from "../src/lib/i18n";

test("language switching retains a deep property route and encoded filters", () => {
  assert.equal(switchLocalePath("/ar/properties/MDN-R-0021", "city=jeddah&bedrooms=2", "en"),
    "/en/properties/MDN-R-0021?city=jeddah&bedrooms=2");
  assert.equal(switchLocalePath("/en/stays", "city=%D8%AC%D8%AF%D8%A9", "ar"),
    "/ar/stays?city=%D8%AC%D8%AF%D8%A9");
  assert.equal(localeSchema.safeParse("fr").success, false);
});
