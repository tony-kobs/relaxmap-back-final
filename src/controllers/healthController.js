export const getHealth = async (req, res) => {
  res.status(200).json({
    message: 'OK',
    timestamp: new Date().toISOString(),
  });
};
