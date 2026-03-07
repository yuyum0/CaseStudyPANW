import { POST } from "@/app/api/analyze/route";

describe("POST /api/analyze", () => {
  it("happy path: valid profile and role returns extracted and missing skills", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileText: "Computer Science graduate. Skills: Python, SQL, Git, REST APIs. Built a FastAPI project.",
        targetRole: "Backend Engineer",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("extractedSkills");
    expect(data).toHaveProperty("matchedSkills");
    expect(data).toHaveProperty("missingSkills");
    expect(data).toHaveProperty("targetRole", "Backend Engineer");
    expect(Array.isArray(data.extractedSkills)).toBe(true);
    expect(data.extractedSkills).toContain("Python");
    expect(data.extractedSkills).toContain("SQL");
    expect(data).toHaveProperty("roadmap");
    expect(data).toHaveProperty("usedFallback");
  });

  it("edge case: empty profile input returns validation error", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileText: "", targetRole: "Frontend Engineer" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toMatch(/required|Profile/i);
  });
});
