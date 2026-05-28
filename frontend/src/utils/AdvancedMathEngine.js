import * as math from 'mathjs';
import nerdamer from 'nerdamer/all.min';

/**
 * Evaluates an advanced mathematical expression.
 * Uses mathjs for numeric/matrix/unit calculations and nerdamer for symbolic algebra/calculus.
 */
export const evaluateAdvanced = (expression) => {
    if (!expression || expression.trim() === '') return '';

    try {
        // Pre-process common symbols
        let processedExpr = expression
            .replace(/π/g, 'pi')
            .replace(/√\(/g, 'sqrt(');

        // Heuristic to detect if it's symbolic math (algebra, calculus)
        const symbolicKeywords = ['diff', 'integrate', 'solve', 'x', 'y', 'z', 'f('];
        const isSymbolic = symbolicKeywords.some(kw => processedExpr.includes(kw));

        if (isSymbolic) {
            // Use nerdamer for symbolic math
            // Evaluate symbolic expression
            const result = nerdamer(processedExpr);
            return result.text(); 
        } else {
            // Use mathjs for standard/engineering math
            const result = math.evaluate(processedExpr);
            // Format to avoid long decimals, but keep matrices/complex intact
            if (typeof result === 'number') {
                return math.format(result, { precision: 14 });
            }
            return result.toString();
        }
    } catch (e) {
        console.warn("Primary evaluation failed, trying fallback:", e);
        try {
            // Fallback: try nerdamer if mathjs failed
            return nerdamer(expression).text();
        } catch (e2) {
            console.error("Fallback evaluation failed:", e2);
            throw new Error("Invalid Expression");
        }
    }
};
