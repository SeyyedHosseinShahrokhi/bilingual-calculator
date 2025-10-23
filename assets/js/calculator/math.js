
import { normalizeInput } from './utils.js';

export function tokenize(s) {
    const tokens = [];
    const positiveNumRegex = /^\d*\.?\d+/;
    let i = 0;

    s = s.trim();

    while (i < s.length) {
        if (/\s/.test(s[i])) { i++; continue; }

        const remaining = s.substring(i);
        const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;

        if (s[i] === '-') {
            if (!lastToken || lastToken.type === 'op') {
                const numMatch = remaining.match(/^-?\d*\.?\d+/);
                if (numMatch) {
                    tokens.push({ type: 'num', value: parseFloat(numMatch[0]) });
                    i += numMatch[0].length;
                    continue;
                }
            }
        }

        if (/[+\-*/]/.test(s[i])) {
            tokens.push({ type: 'op', value: s[i] });
            i++;
            continue;
        }

        const numMatch = remaining.match(positiveNumRegex);
        if (numMatch) {
            tokens.push({ type: 'num', value: parseFloat(numMatch[0]) });
            i += numMatch[0].length;
            continue;
        }

        i++; // ناشناخته‌ها نادیده گرفته می‌شوند
    }

    return tokens;
}

export function toRPN(tokens) {
    const out = [];
    const ops = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const t of tokens) {
        if (t.type === 'num') {
            out.push(t);
        } else if (t.type === 'op') {
            while (ops.length && precedence[ops[ops.length - 1].value] >= precedence[t.value]) {
                out.push(ops.pop());
            }
            ops.push(t);
        }
    }
    while (ops.length) out.push(ops.pop());
    return out;
}

export function evalRPN(rpn) {
    const stack = [];
    for (const t of rpn) {
        if (t.type === 'num') {
            stack.push(t.value);
        } else if (t.type === 'op') {
            if (stack.length < 2) return NaN;
            const b = stack.pop();
            const a = stack.pop();
            let value = 0;
            switch (t.value) {
                case '+': value = a + b; break;
                case '-': value = a - b; break;
                case '*': value = a * b; break;
                case '/': value = (b === 0) ? Infinity : a / b; break;
                default: return NaN;
            }
            stack.push(value);
        }
    }
    return stack.length === 1 ? stack[0] : NaN;
}

export function safeEvaluate(expression, normalizationRegex, normalizationMap) {
    try {
        const sanitized = normalizeInput(expression, normalizationRegex, normalizationMap).replace(/\s+/g, '');
        if (!sanitized) return 0;
        const tokens = tokenize(sanitized);
        const rpn = toRPN(tokens);
        return evalRPN(rpn);
    } catch (e) {
        console.error("Evaluation Error:", e.message);
        return NaN;
    }
}
