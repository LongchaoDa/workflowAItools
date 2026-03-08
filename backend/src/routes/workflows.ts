import { Router } from "express";
import { getWorkflowExample, listWorkflowExamples } from "../workflowExamples.js";

const router = Router();

router.get("/examples", (_req, res) => {
  try {
    const items = listWorkflowExamples();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list workflow examples", error: String(error) });
  }
});

router.get("/examples/:slug", (req, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const detail = getWorkflowExample(slug);
    return res.status(200).json(detail);
  } catch (error) {
    return res.status(404).json({ message: "Workflow example not found", error: String(error) });
  }
});

export default router;
