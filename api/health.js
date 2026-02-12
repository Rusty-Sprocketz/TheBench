module.exports = (req, res) => {
  res.json({
    status: 'ok',
    agents: {
      architect: !!process.env.ANTHROPIC_API_KEY,
      operator: !!process.env.OPENAI_API_KEY,
      culture: !!process.env.GEMINI_API_KEY,
    },
  });
};
