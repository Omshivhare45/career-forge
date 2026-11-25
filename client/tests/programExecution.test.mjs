import test from 'node:test';
import assert from 'node:assert/strict';
import { executeProgram } from '../src/features/dsa/utils/programExecution.js';

test('executes once with empty stdin and no test cases or function harness', async () => {
  const calls = [];
  const output = await executeProgram(async (payload) => { calls.push(payload); return { data: { data: { stdout: 'Hello\n', status: 'Accepted' } } }; }, 'Python', 'print("Hello")');
  assert.deepEqual(calls, [{ language: 'Python', code: 'print("Hello")', stdin: '' }]);
  assert.equal(output.stdout, 'Hello\n');
  assert.equal(output.executionStatus, '');
});
test('preserves input and output whitespace and exposes compiler errors', async () => {
  const output = await executeProgram(async (payload) => {
    assert.equal(payload.stdin, '  5\n');
    return { data: { data: { stdout: '  result\n\n', stderr: 'diagnostic', compile_output: 'compile error', executionStatus: 'Compilation Error' } } };
  }, 'C++', 'int main() {}', '  5\n');
  assert.equal(output.stdout, '  result\n\n');
  assert.equal(output.stderr, 'diagnostic');
  assert.equal(output.compileOutput, 'compile error');
  assert.equal(output.executionStatus, 'Compilation Error');
});
test('empty code does not call execution service and network failures propagate', async () => {
  let called = false;
  await assert.rejects(executeProgram(async () => { called = true; }, 'Java', '  '), /Write some code/);
  assert.equal(called, false);
  await assert.rejects(executeProgram(async () => { throw new Error('Service unavailable'); }, 'Python', 'print(1)'), /Service unavailable/);
});
