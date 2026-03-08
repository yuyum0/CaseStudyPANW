import { extractSkillsFromProfile } from "@/lib/parser";

describe("extractSkillsFromProfile", () => {
  it("extracts skills mentioned in profile text", () => {
    const text = "I know Python, SQL, and React. Used Git for version control.";
    const skills = extractSkillsFromProfile(text);
    expect(skills).toContain("Python");
    expect(skills).toContain("SQL");
    expect(skills).toContain("React");
    expect(skills).toContain("Git");
  });

  it("returns empty array for empty profile", () => {
    const skills = extractSkillsFromProfile("");
    expect(skills).toEqual([]);
  });
});
