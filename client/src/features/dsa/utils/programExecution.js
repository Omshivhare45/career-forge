// Plain execution deliberately sends no expected output, harness or test cases.
export async function executeProgram(execute, language, code, stdin = '') {
  if (!code?.trim()) throw new Error('Write some code before running.');
  const response = await execute({ language, code, stdin });
  const data = response.data?.data || {};
  return {
    mode: 'run', stdout: data.stdout || '', stderr: data.stderr || '',
    compileOutput: data.compile_output || '', executionStatus: data.executionStatus || '',
    status: data.status || '', runtime: data.runtime || '', memory: data.memory || '',
  };
}
