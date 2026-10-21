export const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That email is already registered' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
};
