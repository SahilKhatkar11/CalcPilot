export function formatResult(val: number): string {
  if (isNaN(val)) return 'Error';
  if (!isFinite(val)) return 'Error: Div by 0';
  
  // Round to 10 decimal places to eliminate float inaccuracies
  const rounded = Math.round(val * 1e10) / 1e10;
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  
  // Format and strip trailing zeros
  const str = rounded.toFixed(10);
  return str.replace(/\.?0+$/, '');
}

export function evaluateExpressionString(evalStr: string): { resultStr: string; status: 'success' | 'div0' | 'error' } {
  if (!evalStr) {
    return { resultStr: '0', status: 'success' };
  }

  // Count open parens and close them
  const openParens = (evalStr.match(/\(/g) || []).length;
  const closeParens = (evalStr.match(/\)/g) || []).length;
  const missingParens = Math.max(0, openParens - closeParens);
  const fullEvalStr = evalStr + ')'.repeat(missingParens);

  try {
    // Replace custom tokens with JS Math equivalents
    let jsCode = fullEvalStr
      .replace(/math\.sqrt\(/g, 'Math.sqrt(')
      .replace(/\*\*/g, '**');

    // Safe Function evaluation
    const fn = new Function('Math', `return ${jsCode};`);
    const val = fn(Math);

    if (val === Infinity || val === -Infinity) {
      return { resultStr: 'Error: Div by 0', status: 'div0' };
    }

    if (isNaN(val)) {
      return { resultStr: 'Error', status: 'error' };
    }

    return { resultStr: formatResult(val), status: 'success' };
  } catch (err) {
    return { resultStr: 'Error', status: 'error' };
  }
}
