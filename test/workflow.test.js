import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeStep, completionStatus, createProgress, deserializeProgress,
  generateWorkflow, serializeProgress,
} from '../src/workflow.js';

const input = { goal: ' Publish a release ', steps: [{ title: 'Build' }, { title: 'Verify' }, { title: 'Publish' }] };

test('workflow generation is deterministic and normalizes boundary whitespace', () => {
  const first = generateWorkflow(input);
  const second = generateWorkflow({ goal: 'Publish a release', steps: [{ title: 'Build' }, { title: 'Verify' }, { title: 'Publish' }] });
  assert.deepEqual(first, second);
  assert.equal(first.steps[0].id, `${first.id}-step-1`);
});

test('validation rejects malformed and oversized workflows', () => {
  assert.throws(() => generateWorkflow(null), /input must be an object/);
  assert.throws(() => generateWorkflow({ goal: 'x', steps: [] }), /between 1 and 50/);
  assert.throws(() => generateWorkflow({ goal: 'x', steps: [{ title: ' ' }] }), /non-empty title/);
  assert.throws(() => generateWorkflow({ goal: 'x', steps: Array.from({ length: 51 }, () => ({ title: 'x' })) }), /between 1 and 50/);
});

test('completion is idempotent and reports progress', () => {
  const workflow = generateWorkflow(input);
  const progress = createProgress(workflow);
  completeStep(progress, workflow, workflow.steps[0].id);
  completeStep(progress, workflow, workflow.steps[0].id);
  assert.deepEqual(completionStatus(progress, workflow), { completed: 1, total: 3, percent: 33, complete: false });
  completeStep(progress, workflow, workflow.steps[1].id);
  completeStep(progress, workflow, workflow.steps[2].id);
  assert.equal(completionStatus(progress, workflow).complete, true);
  assert.throws(() => completeStep(progress, workflow, 'unknown'), /unknown step/);
});

test('progress persists through a validated, deduplicated representation', () => {
  const workflow = generateWorkflow(input);
  const progress = createProgress(workflow);
  completeStep(progress, workflow, workflow.steps[0].id);
  const restored = deserializeProgress(serializeProgress({ ...progress, completed: [...progress.completed, progress.completed[0]] }));
  assert.deepEqual(restored, progress);
  assert.throws(() => deserializeProgress('{bad json'), /valid JSON/);
  assert.throws(() => deserializeProgress('{"workflowId":1,"completed":[]}'), /invalid persisted/);
});
