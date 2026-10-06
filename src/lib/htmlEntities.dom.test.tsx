import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodeEntity, setEntityTable } from "@/lib/htmlEntities";
import { HTML5_ENTITIES } from "@/lib/htmlEntities.data";

/** The app decodes named entities through the DOM; this holds that decoding to the generated WHATWG table. */
describe("decodeEntity through the DOM", () => {
  beforeAll(() => setEntityTable(null));
  afterAll(() => setEntityTable(null));

  it("decodes every named entity exactly as the table does", () => {
    const wrong = Object.entries(HTML5_ENTITIES).filter(([name, text]) => decodeEntity(name) !== text);
    expect(wrong).toEqual([]);
  });

  it("refuses what is no entity, and a legacy prefix that the browser would read as a shorter one", () => {
    for (const body of ["constructor", "nosuchentity", "ampx", "notit", "copyx"]) {
      expect(decodeEntity(body), body).toBeNull();
    }
    expect(decodeEntity("semi")).toBe(";");
  });
});
