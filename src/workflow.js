import { createHash } from 'node:crypto';

const MAX_STEPS = 50;

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertWorkflowInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('workflow input must be an object');
  }
  if (typeof input.goal !== 'string' || input.goal.trim().length === 0) {
    throw new RangeError('goal must be a non-empty string');
  }
  if (!Array.isArray(input.steps) || input.steps.length === 0 || input.steps.length > MAX_STEPS) {
    throw new RangeError(`steps must contain between 1 and ${MAX_STEPS} items`);
  }
  input.steps.forEach((step, index) => {
    if (!step || typeof step !== 'object' || typeof step.title !== 'string' || step.title.trim() === '') {
      throw new RangeError(`step ${index + 1} must have a non-empty title`);
    }
  });
}

function workflowId(goal, steps) {
  const digest = createHash('sha256')
    .update(stableJson({ goal: goal.trim(), steps: steps.map(({ title }) => title.trim()) }))
    .digest('hex');
  return `workflow-${digest.slice(0, 16)}`;
}

export function generateWorkflow(input) {
  assertWorkflowInput(input);
  const goal = input.goal.trim();
  const titles = input.steps.map(({ title }) => title.trim());
  const id = workflowId(goal, input.steps);
  return {
    id,
    goal,
    steps: titles.map((title, index) => ({
      id: `${id}-step-${index + 1}`,
      order: index + 1,
      title,
    })),
  };
}

export function createProgress(workflow) {
  if (!workflow || !Array.isArray(workflow.steps) || typeof workflow.id !== 'string') {
    throw new TypeError('a generated workflow is required');
  }
  return { workflowId: workflow.id, completed: [] };
}

export function completeStep(progress, workflow, stepId) {
  if (!progress || progress.workflowId !== workflow?.id) throw new RangeError('progress belongs to another workflow');
  if (!workflow.steps.some((step) => step.id === stepId)) throw new RangeError('unknown step');
  if (!progress.completed.includes(stepId)) progress.completed.push(stepId);
  return progress;
}

export function completionStatus(progress, workflow) {
  if (!progress || progress.workflowId !== workflow?.id) throw new RangeError('progress belongs to another workflow');
  const total = workflow.steps.length;
  const completed = workflow.steps.filter(({ id }) => progress.completed.includes(id)).length;
  return { completed, total, percent: Math.round((completed / total) * 100), complete: completed === total };
}

export function serializeProgress(progress) {
  if (!progress || typeof progress.workflowId !== 'string' || !Array.isArray(progress.completed)) {
    throw new TypeError('invalid progress');
  }
  return JSON.stringify({ workflowId: progress.workflowId, completed: [...new Set(progress.completed)] });
}

export function deserializeProgress(serialized) {
  let value;
  try { value = JSON.parse(serialized); } catch { throw new TypeError('progress must be valid JSON'); }
  if (!value || typeof value.workflowId !== 'string' || !Array.isArray(value.completed) || value.completed.some((id) => typeof id !== 'string')) {
    throw new TypeError('invalid persisted progress');
  }
  return { workflowId: value.workflowId, completed: [...new Set(value.completed)] };
}
