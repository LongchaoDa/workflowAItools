import { describe, expect, test } from "vitest";
import { getWorkflowExample, listWorkflowExamples, parseWorkflowInfo } from "../src/workflowExamples.js";

describe("workflow examples parser", () => {
  test("parseWorkflowInfo parses staged format", () => {
    const raw = `Stage1 Name: Flux\nType: text to video\nLink: https://example.com\nInput: prompt here\nStage2 Name: Kling\nType: image+text to video\nInput: input_image1.jpg\nPrompt: task prompt\nOutput: out.mp4`;
    const stages = parseWorkflowInfo(raw);

    expect(stages.length).toBe(2);
    expect(stages[0].name).toBe("Flux");
    expect(stages[1].prompt).toBe("task prompt");
    expect(stages[1].output).toBe("out.mp4");
  });

  test("loads workflow1 example with media urls", () => {
    const detail = getWorkflowExample("workflow1");
    expect(detail.slug).toBe("workflow1");
    expect(detail.stages.length).toBeGreaterThanOrEqual(2);
    expect(detail.inputImageUrl).toContain("/media/workflow1/input_image1.jpg");
    expect(detail.outputVideoUrl).toContain("/media/workflow1/kling_output.mp4");
  });

  test("lists available examples", () => {
    const list = listWorkflowExamples();
    expect(list.some((item) => item.slug === "workflow1")).toBe(true);
  });
});
