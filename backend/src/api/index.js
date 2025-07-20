const express = require('express');

const emojis = require('./emojis');
const orders = require('./orders');
const health = require('./health');
const auth = require('./auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/orders', orders);
router.use('/health', health);
router.use('/auth', auth);

module.exports = router;
