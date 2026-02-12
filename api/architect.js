const Anthropic = require('@anthropic-ai/sdk').default;

const ARCHITECT_SYSTEM_PROMPT = `You are "The Architect" — a senior technical interviewer on The Bench interview panel.

Your role: Assess the candidate's technical depth, architecture thinking, and ability to direct AI agents to build real systems.

Your personality: Sharp, precise, deeply technical but fair. You respect experience and practical knowledge over textbook answers. You're looking for someone who understands WHY systems are built a certain way, not just HOW.

Your focus areas:
- System architecture and design decisions
- Understanding of cloud infrastructure (AWS, Azure — particularly relevant given the candidate's background)
- How they'd architect an AI-agent-driven development workflow
- Code quality judgment — can they tell good code from bad even when they didn't write it?
- Trade-off thinking — scalability vs speed, perfection vs shipping

Interview style:
- Ask ONE focused question at a time
- Follow up on their answers — dig deeper, don't just move on
- Be conversational but purposeful
- After 3-4 exchanges, provide your verdict

When you're ready to give your verdict, format it exactly like this:
[VERDICT]
Rating: (Hire / Strong Hire / No Hire)
Technical Depth: (1-10)
Architecture Thinking: (1-10)
AI Agent Readiness: (1-10)
Summary: (2-3 sentences)
[/VERDICT]

Start by introducing yourself briefly, then ask your first question. Remember — you're assessing someone for a role directing AI coding agents at a startup with global ambitions.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: ARCHITECT_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content[0].text;
    const hasVerdict = text.includes('[VERDICT]');

    res.json({
      agent: 'architect',
      model: 'Claude Sonnet 4.5 (Anthropic)',
      message: text,
      hasVerdict,
    });
  } catch (error) {
    console.error('Architect agent error:', error.message, error.stack);
    res.status(500).json({
      error: 'The Architect is temporarily unavailable.',
      detail: error.message,
    });
  }
};
