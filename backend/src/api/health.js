const express = require('express');
const authService = require('../services/auth.service');
const amazonSPService = require('../services/amazon-sp-api.service');

const router = express.Router();

/**
 * @route GET /api/v1/health
 * @desc Get API health status
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const configValidation = authService.validateConfig();
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      amazon: {
        config: configValidation.config,
        isValid: configValidation.isValid,
        warnings: configValidation.warnings
      },
      cache: {
        size: authService.getCacheStats().size
      }
    };

    // If configuration is valid, test Amazon SP API connection
    if (configValidation.isValid) {
      try {
        await amazonSPService.initialize();
        healthStatus.amazon.connection = 'connected';
      } catch (error) {
        healthStatus.amazon.connection = 'error';
        healthStatus.amazon.connectionError = error.message;
        healthStatus.status = 'degraded';
      }
    } else {
      healthStatus.amazon.connection = 'not_configured';
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/health/config
 * @desc Get Amazon SP API configuration status (without sensitive data)
 * @access Public
 */
router.get('/config', (req, res) => {
  try {
    const configValidation = authService.validateConfig();
    
    res.json({
      success: true,
      data: {
        isValid: configValidation.isValid,
        missingFields: configValidation.missingFields,
        warnings: configValidation.warnings,
        config: configValidation.config
      }
    });
  } catch (error) {
    console.error('Config check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/health/cache
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache', (req, res) => {
  try {
    const cacheStats = authService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        size: cacheStats.size,
        keys: cacheStats.keys,
        expiries: cacheStats.expiries.map(([key, expiry]) => ({
          key,
          expiresAt: new Date(expiry).toISOString(),
          isValid: Date.now() < expiry
        }))
      }
    });
  } catch (error) {
    console.error('Cache check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/health/cache/clear
 * @desc Clear all cache
 * @access Public
 */
router.post('/cache/clear', (req, res) => {
  try {
    const beforeSize = authService.getCacheStats().size;
    authService.clearCache();
    const afterSize = authService.getCacheStats().size;
    
    res.json({
      success: true,
      data: {
        message: 'Cache cleared successfully',
        beforeSize,
        afterSize
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 