const createApp = require('./app');
const env = require('./config/env');

const app = createApp();
const port = env.port;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
