export const notImplemented = (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};
