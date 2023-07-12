const express = require('express');
const {router} = require('./routes/routes');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(router);
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
