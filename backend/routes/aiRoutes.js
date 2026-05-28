const express = require('express');
const router = express.Router();

router.post('/ai/chat', async (req, res) => {
    try {
        const { message, image, history } = req.body;

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'OPENROUTER_API_KEY is not set in backend .env file.' });
        }

        // Format history as multi-turn content for OpenAI/OpenRouter schema
        const messages = [];

        // System instruction with common math/geometry formulas cheat sheet
        messages.push({
            role: "system",
            content: `You are an expert Math and Geometry Solver. Provide clear, step-by-step solutions to mathematical and geometric problems. 
            When given an image, analyze it carefully to extract numbers, formulas, and geometric properties. If a specific topic is asked, explain it clearly with examples.
            
            Use the following standard formulas as a reference cheat sheet to assist you:
            - Geometry (2D Area): Triangle = 1/2 * b * h, Rectangle = l * w, Circle = π * r^2, Trapezoid = 1/2 * (a + b) * h, Parallelogram = b * h
            - Geometry (Perimeter): Circle (Circumference) = 2 * π * r, Rectangle = 2l + 2w
            - Geometry (3D Volume): Sphere = 4/3 * π * r^3, Cylinder = π * r^2 * h, Cone = 1/3 * π * r^2 * h, Rectangular Prism = l * w * h, Pyramid = 1/3 * B * h
            - Geometry (3D Surface Area): Sphere = 4 * π * r^2, Cylinder = 2 * π * r * h + 2 * π * r^2
            - Trigonometry: SOH CAH TOA (sin = opp/hyp, cos = adj/hyp, tan = opp/adj), Pythagorean Theorem: a^2 + b^2 = c^2, Law of Sines: a/sin(A) = b/sin(B) = c/sin(C), Law of Cosines: c^2 = a^2 + b^2 - 2ab*cos(C)
            - Algebra: Quadratic Formula: x = (-b ± √(b^2 - 4ac)) / 2a, Slope: m = (y2 - y1) / (x2 - x1)
            - Rules of Exponents: x^a * x^b = x^(a+b), (x^a)^b = x^(a*b), x^-a = 1/x^a
            - Logarithms: log_b(x*y) = log_b(x) + log_b(y), log_b(x^y) = y*log_b(x)`
        });

        if (history && history.length > 0) {
            for (const msg of history) {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            }
        }

        // Prepare the current message part
        const currentMessageContent = [];

        if (message) {
            currentMessageContent.push({ type: "text", text: message });
        } else if (!image) {
            currentMessageContent.push({ type: "text", text: "Please solve this math problem." });
        }

        // If image is provided
        if (image) {
            currentMessageContent.push({
                type: "image_url",
                image_url: {
                    url: image // The frontend sends data:image/... base64 string
                }
            });
        }

        messages.push({
            role: 'user',
            content: currentMessageContent
        });

        // Call OpenRouter API using native fetch
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // Route it to Gemini 2.5 Flash via OpenRouter
                messages: messages,
                max_tokens: 1500 // Limit tokens to prevent OpenRouter from trying to reserve 65k tokens on a free/low-credit account
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errData}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            res.json({ text: data.choices[0].message.content });
        } else {
            throw new Error("Invalid response from OpenRouter");
        }
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to process AI request. ' + error.message });
    }
});

module.exports = router;
